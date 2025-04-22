document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const studentForm = document.getElementById("student-form");
  const adminPanel = document.getElementById("admin-panel");
  const adminForm = document.getElementById("admin-form");
  const addStudentForm = document.getElementById("add-student-form");
  const roleRadios = document.querySelectorAll('input[name="role"]');

  const transactionTab = document.getElementById("transaction-tab");
  const studentTab = document.getElementById("student-tab");

  const studentInfo = document.getElementById("student-info");
  const studentName = document.getElementById("student-name");
  const studentBalance = document.getElementById("student-balance");
  const transactionList = document.getElementById("transaction-list");

  // Handle role switching
  roleRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "student") {
        studentForm.style.display = "flex";
        adminPanel.style.display = "none";
        studentInfo.style.display = "none";
      } else {
        studentForm.style.display = "none";
        adminPanel.style.display = "flex";
        adminForm.style.display = "flex";
        addStudentForm.style.display = "none";
        transactionTab.classList.add("active-tab");
        studentTab.classList.remove("active-tab");
        studentInfo.style.display = "none";
      }
    });
  });

  // Toggle between transaction and student forms
  transactionTab.addEventListener("click", () => {
    adminForm.style.display = "flex";
    addStudentForm.style.display = "none";
    transactionTab.classList.add("active-tab");
    studentTab.classList.remove("active-tab");
  });

  studentTab.addEventListener("click", () => {
    adminForm.style.display = "none";
    addStudentForm.style.display = "flex";
    transactionTab.classList.remove("active-tab");
    studentTab.classList.add("active-tab");
  });

  // Handle student balance lookup form
  studentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(studentForm);

    const studentId = formData.get("student_id");
    const firstName = formData.get("first_name");
    const lastName = formData.get("last_name");

    try {
      const response = await fetch(`/student/${studentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        studentName.textContent = `${result.first_name} ${result.last_name}`;
        studentBalance.textContent = Number(result.balance || 0).toFixed(2);
        transactionList.innerHTML = "";

        result.transactions.forEach((tx) => {
          const li = document.createElement("li");
          li.textContent = `${tx.type} — $${tx.amount}`;
          transactionList.appendChild(li);
        });

        studentInfo.style.display = "block";
      } else {
        alert(`Error: ${result.error}`);
        studentInfo.style.display = "none";
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
      studentInfo.style.display = "none";
    }
  });

  // Handle admin transaction form submission
  adminForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(adminForm);

    const data = {
      student_id: formData.get("admin_student_id"),
      type: formData.get("transaction_type"),
      amount: parseFloat(formData.get("transaction_amount")),
    };

    try {
      const response = await fetch("/admin/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        alert("Error: " + result.error);
      } else {
        alert("Transaction recorded successfully.");
        adminForm.reset();
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
    }
  });

  // Handle add student form submission
  addStudentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(addStudentForm);

    const data = {
      first_name: formData.get("new_first_name"),
      last_name: formData.get("new_last_name"),
      student_id: formData.get("new_student_id"),
      initial_transaction: {
        type: "charge",
        amount: parseFloat(formData.get("new_transaction_amount")),
      }
    };

    try {
      const response = await fetch("/admin/add-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text}`);
      }

      const result = await response.json();

      if (result.error) {
        alert("Error: " + result.error);
      } else {
        alert("Student added successfully.");
        addStudentForm.reset();
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
    }
  });
});
