const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000; // 리액트(3000)와 겹치지 않게 5000번 사용

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());

// [중요] MariaDB 연결 설정 (본인의 정보로 수정하세요)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // MariaDB 아이디
  password: 'your_password', // MariaDB 비밀번호
  database: 'oled_db' // 사용할 데이터베이스 이름
});

db.connect((err) => {
  if (err) {
    console.error('DB 연결 실패:', err);
    return;
  }
  console.log('MariaDB 연결 성공!');
});

// --- API 경로 설정 ---

// 1. 사용자 정보 가져오기
app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM oled_users', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// 2. 사용자 정보 저장하기
app.post('/api/users', (req, res) => {
  const users = req.body; // 리액트에서 보낸 데이터
  // 주의: 실제 운영시에는 테이블 구조에 맞게 INSERT 문을 작성해야 합니다.
  // 아래는 기존 데이터를 지우고 새로 넣는 간단한 예시입니다.
  db.query('DELETE FROM oled_users', () => {
    const values = users.map(u => [u.username, u.role, u.active]);
    db.query('INSERT INTO oled_users (username, role, active) VALUES ?', [values], (err) => {
      if (err) return res.status(500).send(err);
      res.json({ success: true });
    });
  });
});

// 3. 재고/자재 데이터 저장 (Matflow 핵심 데이터)
app.post('/api/materials', (req, res) => {
  const data = JSON.stringify(req.body);
  const sql = "INSERT INTO oled_materials (content) VALUES (?) ON DUPLICATE KEY UPDATE content = ?";
  db.query(sql, [data, data], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
});

app.listen(port, () => {
  console.log(`백엔드 서버가 http://localhost:${port} 에서 돌아가고 있습니다.`);
});