const mysql = require('mysql2/promise');
async function init() {
    const pool = mysql.createPool({
        host: '100.84.187.111',
        port: 3306,
        user: 'root',
        password: 'Pckpl,888',
        database: 'file_manage_security'
    });
    try {
        console.log('Connecting...');
        await pool.query(`CREATE TABLE IF NOT EXISTS bible_user (
          id INT AUTO_INCREMENT PRIMARY KEY,
          openid VARCHAR(64) NOT NULL UNIQUE COMMENT '微信唯一标识',
          nickname VARCHAR(100) DEFAULT '' COMMENT '微信昵称',
          avatar VARCHAR(500) DEFAULT '' COMMENT '微信头像URL',
          last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最近登录时间',
          create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
          INDEX idx_openid (openid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户主表';`);
        console.log('Created bible_user');
        await pool.query(`CREATE TABLE IF NOT EXISTS bible_user_plan (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL COMMENT '关联 bible_user.id',
          plan_json LONGTEXT COMMENT '完整的读经计划 JSON',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
          UNIQUE KEY uk_user (user_id),
          FOREIGN KEY (user_id) REFERENCES bible_user(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户读经计划云端存储';`);
        console.log('Created bible_user_plan');
    } catch(e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
init();
