// migrate.js
const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'xasanaavto717', // замените при необходимости
        password: 'YifimitjTkdFzpwz', // у Laragon часто пусто
        database: 'xasanaavto717',
    });

    const queries = [
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('user', 'admin') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS contract (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            avto_info VARCHAR(255) NOT NULL,
            start_date VARCHAR(10) NOT NULL,
            end_date VARCHAR(10) NOT NULL,
            price INT NOT NULL,
            added_anmount INT NOT NULL,
            first_payment INT NOT NULL,
            finaly INT DEFAULT 0,
            user_id INT NOT NULL,
            next_payment INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS contract_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            contract_id INT,
            image_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (contract_id) REFERENCES contract(id) ON DELETE CASCADE
        );`,

        `CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            contract_id INT,
            pay INT NOT NULL,
            date VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (contract_id) REFERENCES contract(id) ON DELETE CASCADE
        );`,

        `CREATE TABLE IF NOT EXISTS notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            data VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS refresh_token (
		 id INT AUTO_INCREMENT PRIMARY KEY,
    	 user_id INT NOT NULL,
    	 token VARCHAR(500) NOT NULL,
    	 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    	 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
    ];

    for (let query of queries) {
        try {
            await connection.query(query);
            console.log('✅ Выполнено:', query.split('(')[0]);
        } catch (err) {
            console.error('❌ Ошибка:', err.message);
        }
    }

    await connection.end();
    console.log('🎉 Все миграции выполнены');
}

migrate();
