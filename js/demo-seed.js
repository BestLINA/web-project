function seedDemoAccount() {
    const users = JSON.parse(localStorage.getItem("users")) || [];

    // Prevent duplicate demo account creation
    if (users.find(u => u.email === "demo@awj.com")) return;

    const uid = "demo-user-001";

    // Create demo user
    users.push({
        id: uid,
        fullName: "Demo Student",
        email: "demo@awj.com",
        password: "Demo1234"
    });

    localStorage.setItem("users", JSON.stringify(users));

    // Generate dynamic future dates
    const today = new Date();

    function fmt(days) {
        const d = new Date(today);
        d.setDate(today.getDate() + days);
        return d.toISOString().split("T")[0];
    }

    // Seed demo courses
    localStorage.setItem("courses_" + uid, JSON.stringify([
        {
            code: "CS101",
            name: "Intro to Programming",
            color: "#9b7edc"
        },
        {
            code: "MATH202",
            name: "Calculus II",
            color: "#7ec8e3"
        },
        {
            code: "SWE321",
            name: "Web Development",
            color: "#8bd3c7"
        }
    ]));

    // Seed demo deadlines
    localStorage.setItem("deadlines_" + uid, JSON.stringify([
        {
            course: "SWE321",
            title: "Final Project Report",
            type: "Assignment",
            date: fmt(2),
            completed: false
        },
        {
            course: "CS101",
            title: "Midterm Exam",
            type: "Exam",
            date: fmt(5),
            completed: false
        },
        {
            course: "MATH202",
            title: "Problem Set 4",
            type: "Assignment",
            date: fmt(10),
            completed: false
        }
    ]));

    // Seed availability only
    localStorage.setItem("availability_" + uid, JSON.stringify([
        {
            day: "Sunday",
            start: "09:00",
            end: "11:00"
        },
        {
            day: "Tuesday",
            start: "14:00",
            end: "16:00"
        },
        {
            day: "Thursday",
            start: "10:00",
            end: "12:00"
        }
    ]));

    /*
      IMPORTANT:
      No progress data is preloaded.

      completedSessions and missedSessions are NOT seeded.
      This means:
      - Productivity starts at 0%
      - Focus Rate starts at 0%
      - Recent Activity starts empty

      All progress is generated dynamically ONLY when the user
      interacts with real study sessions in the Study Plan page.

      This matches the real system behavior exactly
      and avoids fake/static analytics.
    */
}

seedDemoAccount();