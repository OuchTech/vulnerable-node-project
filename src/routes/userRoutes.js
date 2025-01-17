const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config');

// Pour parser le corps des requêtes JSON
router.use(express.json());

/**
 * VULNÉRABILITÉ 1 : SQL Injection
 * L’exemple ci-dessous assemble directement les paramètres de la requête dans la requête SQL,
 * sans utiliser de requête paramétrée ni d’échappement approprié.
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Requête vulnérable à l'injection SQL
  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error", error: err.message });
    }
    if (!row) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Login successful", user: row });
  });
});

/**
 * VULNÉRABILITÉ 2 : XSS (Cross-Site Scripting)
 * Ici, on renvoie directement du HTML dynamique avec du contenu fourni par l’utilisateur (req.body.comment).
 * Dans un vrai site, si on rend ce HTML côté client, on peut avoir du XSS.
 */
router.post('/comment', (req, res) => {
  const { username, comment } = req.body;

  // Stockage en base (optionnel, on montre juste l’idée)
  const insertSql = `INSERT INTO users(username, password) VALUES('${username}', 'defaultPass')`;
  db.run(insertSql, (err) => {
    if (err) {
      return res.status(500).json({ message: "Error inserting user", error: err.message });
    }
    // Réponse vulnérable car on renvoie du HTML avec potentiellement du script
    const responseHtml = `<p>User <strong>${username}</strong> commented: ${comment}</p>`;
    res.send(responseHtml);
  });
});

/**
 * VULNÉRABILITÉ 3 : Utilisation dangereuse de 'eval()'
 * On va imaginer un endpoint qui exécute du code JavaScript passé en paramètre.
 * C'est évidemment très dangereux si un utilisateur non fiable peut l'appeler.
 */
router.post('/execute-code', (req, res) => {
  const { code } = req.body;
  try {
    const result = eval(code); // Vulnérable : exécute n'importe quel code passé par l'utilisateur
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * VULNÉRABILITÉ 4 : Authentification JWT mal gérée
 * On va simuler la génération d'un token JWT, mais on stocke la clé secrète en clair et
 * on ne vérifie pas correctement le token ensuite (pour la démo).
 */
router.post('/generate-token', (req, res) => {
  const jwt = require('jsonwebtoken');
  const { username } = req.body;

  // On signe le token avec un secret "insecure" défini dans config.js
  const token = jwt.sign({ username }, config.JWT_SECRET, { expiresIn: '1h' });

  // Aucune vérification avancée n’est faite ici, c'est juste une démo
  res.json({ token });
});

/**
 * Route pour vérifier le token (très simplifiée)
 * - On n'utilise pas de middleware sécurisé, pas de gestion d'erreur complète
 */
router.get('/verify-token', (req, res) => {
  const jwt = require('jsonwebtoken');
  const token = req.headers.authorization?.split(' ')[1];

  // Vérification minimaliste
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token invalid" });
    }

    // Normalement on vérifierait l'utilisateur, la date d'expiration, etc.
    res.json({ message: "Token is valid", decoded });
  });
});

module.exports = router;
