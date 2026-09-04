import pool from "./db.js";

async function testDelete() {
  try {
    const insertRes = await pool.query(
      "INSERT INTO users (name, email, password, phone, role, status) VALUES ('Test Delete', 'testdel@example.com', 'pass', '+91 99999 88888', 'customer', 'Active') RETURNING id"
    );
    const testId = insertRes.rows[0].id;
    console.log("Inserted temporary user with ID:", testId);

    const delRes = await fetch(`http://localhost:5000/api/admin/users/${testId}`, { method: "DELETE" });
    const delData = await delRes.json();
    console.log("DELETE API response:", delData);

    const verify = await pool.query("SELECT * FROM users WHERE id = $1", [testId]);
    console.log("User exists in DB after delete?:", verify.rowCount > 0);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testDelete();
