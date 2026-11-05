// =====================================================================
// server/tests/comment.test.js - Tests de sécurité de l'API commentaires
// Test runner natif de Node (node:test) + Supertest
// Lancer : cd server  puis  npm test   (MySQL Docker doit tourner)
// =====================================================================
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { pool, initDB } = require('../config/db');
const { renderSafeHtml } = require('../controllers/comment.controller');

const BOB = { username: 'bob_test', email: 'bob_test@blog.com', password: 'Bob-Test-123!' };

let alice; // admin du seed
let bob;   // second utilisateur créé pour les tests
let articleId;
let aliceCommentId;

async function login(email, password) {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return `Bearer ${res.body.token}`;
}

before(async () => {
    await initDB(); // garantit que la table comments existe
    await request(app).post('/api/auth/register').send(BOB); // ignoré si Bob existe déjà
    alice = await login('admin@blog.com', 'password123');
    bob = await login(BOB.email, BOB.password);
    const res = await request(app).get('/api/articles');
    articleId = res.body[0].id;
});

after(async () => {
    await pool.end();
});

describe('Nettoyage XSS (tests unitaires)', () => {
    test('balise <script> supprimée', () => {
        assert.doesNotMatch(renderSafeHtml('<script>alert(1)</script>bonjour'), /<script/i);
    });
    test('attribut onerror supprimé', () => {
        assert.doesNotMatch(renderSafeHtml('<img src=x onerror=alert(1)>'), /onerror/i);
    });
    test('balise mal formée échappée en texte (non exécutable)', () => {
        assert.doesNotMatch(renderSafeHtml("<img src=x onerror=alert('x')>"), /<img/i);
    });
    test('lien javascript: neutralisé (Markdown)', () => {
        assert.doesNotMatch(renderSafeHtml('[clic](javascript:alert(1))'), /javascript:/i);
    });
    test('Markdown légitime conservé', () => {
        assert.match(renderSafeHtml('**gras**'), /<strong>gras<\/strong>/);
    });
    test('HTML légitime conservé', () => {
        assert.match(renderSafeHtml('<b>html</b>'), /<b>html<\/b>/);
    });
    test('texte brut accepté', () => {
        assert.match(renderSafeHtml('simple texte'), /simple texte/);
    });
});

describe('Authentification', () => {
    test('lecture publique autorisée (200)', async () => {
        const res = await request(app).get(`/api/articles/${articleId}/comments`);
        assert.equal(res.status, 200);
        assert.ok(Array.isArray(res.body));
    });
    test('création refusée sans token (403)', async () => {
        const res = await request(app)
            .post(`/api/articles/${articleId}/comments`)
            .send({ content: 'anonyme' });
        assert.equal(res.status, 403); // le middleware existant renvoie 403 sans token
    });
    test('création refusée avec un token forgé (401)', async () => {
        const res = await request(app)
            .post(`/api/articles/${articleId}/comments`)
            .set('Authorization', 'Bearer faux.token.jwt')
            .send({ content: 'pirate' });
        assert.equal(res.status, 401);
    });
});

describe('Validation des entrées', () => {
    test('commentaire vide refusé (400)', async () => {
        const res = await request(app)
            .post(`/api/articles/${articleId}/comments`)
            .set('Authorization', alice).send({ content: '   ' });
        assert.equal(res.status, 400);
    });
    test('commentaire trop long refusé (400)', async () => {
        const res = await request(app)
            .post(`/api/articles/${articleId}/comments`)
            .set('Authorization', alice).send({ content: 'a'.repeat(5001) });
        assert.equal(res.status, 400);
    });
    test("injection SQL dans l'identifiant refusée (400)", async () => {
        const res = await request(app).get(`/api/articles/${encodeURIComponent("1' OR '1'='1")}/comments`);
        assert.equal(res.status, 400);
    });
    test('article inexistant (404)', async () => {
        const res = await request(app)
            .post('/api/articles/999999/comments')
            .set('Authorization', alice).send({ content: 'perdu' });
        assert.equal(res.status, 404);
    });
    test('payload SQL dans le contenu stocké comme simple texte (201)', async () => {
        const payload = "'); DROP TABLE comments; --";
        const res = await request(app)
            .post(`/api/articles/${articleId}/comments`)
            .set('Authorization', alice).send({ content: payload });
        assert.equal(res.status, 201);
        assert.equal(res.body.content, payload); // stocké tel quel, jamais exécuté
    });
    test('payload XSS stocké mais rendu inoffensif (201)', async () => {
        const res = await request(app)
            .post(`/api/articles/${articleId}/comments`)
            .set('Authorization', alice).send({ content: '<img src=x onerror=alert(1)>' });
        assert.equal(res.status, 201);
        assert.doesNotMatch(res.body.content_html, /onerror/i);
    });
});

describe("Contrôle de propriété (seul l'auteur modifie / supprime)", () => {
    before(async () => {
        const res = await request(app)
            .post(`/api/articles/${articleId}/comments`)
            .set('Authorization', alice).send({ content: "commentaire d'Alice" });
        aliceCommentId = res.body.id;
    });

    test('user_id injecté dans le corps ignoré', async () => {
        const res = await request(app)
            .post(`/api/articles/${articleId}/comments`)
            .set('Authorization', bob).send({ content: 'usurpation', user_id: 1 });
        assert.equal(res.status, 201);
        assert.equal(res.body.username, BOB.username);
    });
    test("Bob ne peut pas modifier le commentaire d'Alice (403)", async () => {
        const res = await request(app)
            .put(`/api/comments/${aliceCommentId}`)
            .set('Authorization', bob).send({ content: 'piraté' });
        assert.equal(res.status, 403);
    });
    test("Bob ne peut pas supprimer le commentaire d'Alice (403)", async () => {
        const res = await request(app)
            .delete(`/api/comments/${aliceCommentId}`).set('Authorization', bob);
        assert.equal(res.status, 403);
    });
    test('Alice peut modifier son commentaire (200)', async () => {
        const res = await request(app)
            .put(`/api/comments/${aliceCommentId}`)
            .set('Authorization', alice).send({ content: 'modifié' });
        assert.equal(res.status, 200);
        assert.equal(res.body.content, 'modifié');
    });
    test('Alice peut supprimer son commentaire (204)', async () => {
        const res = await request(app)
            .delete(`/api/comments/${aliceCommentId}`).set('Authorization', alice);
        assert.equal(res.status, 204);
    });
});