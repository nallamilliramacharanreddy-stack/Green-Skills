async function testLogin() {
  const payload = {
    email: "nallamilliramacharanreddy@gmail.com",
    password: "AdminPassword123!",
    role: "admin"
  };
  try {
    console.log("Sending login request to production server...");
    const res = await fetch("https://green-skills-api.onrender.com/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    console.log("Response Status:", res.status);
    const data = await res.json();
    console.log("Response Data:", data);
  } catch (err) {
    console.log("Login Request Failed!");
    console.error(err);
  }
}

testLogin();
