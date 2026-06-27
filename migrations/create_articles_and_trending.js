const db = require('../db');
const { articlesData, trendingTopicsData } = require('../editorial_articles');

const createArticlesAndTrendingTables = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS articles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(512) NOT NULL,
                source VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                full_content LONGTEXT NOT NULL,
                is_active TINYINT(1) DEFAULT 1,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS trending_topics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                trend VARCHAR(20) NOT NULL,
                sort_order INT DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        for (const article of articlesData) {
            const [existing] = await db.query(
                `SELECT id FROM articles
                 WHERE title = ?
                    OR (sort_order = ? AND source IN (
                        'Blockchain Magazine (Featured)',
                        'Cointelegraph Explained',
                        'The Coinomist',
                        'Bitcoin Magazine (Featured)',
                        'Crypto Trends',
                        'Blockchain Insights',
                        'Meme Coin Watch',
                        'Crypto Politics',
                        'CryptoCardiac Editorial'
                    ))
                 LIMIT 1`,
                [article.title, article.sort_order]
            );

            if (existing.length > 0) {
                await db.query(
                    `UPDATE articles
                     SET title = ?, source = ?, category = ?, description = ?, full_content = ?, sort_order = ?, is_active = 1
                     WHERE id = ?`,
                    [
                        article.title,
                        article.source,
                        article.category,
                        article.description,
                        article.full_content,
                        article.sort_order,
                        existing[0].id
                    ]
                );
            } else {
                await db.query(
                    'INSERT INTO articles (title, source, category, description, full_content, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        article.title,
                        article.source,
                        article.category,
                        article.description,
                        article.full_content,
                        article.sort_order
                    ]
                );
            }
        }

        await db.query(`
            UPDATE articles
            SET is_active = 0
            WHERE source IN (
                'Blockchain Magazine (Featured)',
                'Cointelegraph Explained',
                'The Coinomist',
                'Bitcoin Magazine (Featured)',
                'Crypto Trends',
                'Blockchain Insights',
                'Meme Coin Watch',
                'Crypto Politics'
            )
        `);

        for (const topic of trendingTopicsData) {
            const [existingTopic] = await db.query(
                'SELECT id FROM trending_topics WHERE sort_order = ? LIMIT 1',
                [topic.sort_order]
            );

            if (existingTopic.length > 0) {
                await db.query(
                    'UPDATE trending_topics SET title = ?, trend = ?, is_active = 1 WHERE id = ?',
                    [topic.title, topic.trend, existingTopic[0].id]
                );
            } else {
                await db.query(
                    'INSERT INTO trending_topics (title, trend, sort_order) VALUES (?, ?, ?)',
                    [topic.title, topic.trend, topic.sort_order]
                );
            }
        }

        console.log('Articles and trending topics synced');
    } catch (error) {
        console.error('Migration error (articles/trending):', error);
        throw error;
    }
};

module.exports = createArticlesAndTrendingTables;
