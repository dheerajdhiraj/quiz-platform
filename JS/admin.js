// ===============================
// GLOBAL VARIABLE
// ===============================
let currentAdmin = null;

// ===============================
// AUTH STATE CHECK
// ===============================
auth.onAuthStateChanged((user) => {
    if (user) {
        currentAdmin = user;

        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('quiz-creation-section').classList.remove('hidden');
        document.getElementById('quizzes-list').classList.remove('hidden');
        document.getElementById('analytics-section').classList.remove('hidden');

        loadAdminQuizzes();
        loadAnalytics();
    } else {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('quiz-creation-section').classList.add('hidden');
        document.getElementById('quizzes-list').classList.add('hidden');
        document.getElementById('analytics-section').classList.add('hidden');
    }
});

// ===============================
// SIGNUP
// ===============================
function adminSignup() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(() => alert("Account created successfully!"))
        .catch(error => alert(error.message));
}

// ===============================
// LOGIN
// ===============================
function adminLogin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .catch(error => alert(error.message));
}

// ===============================
// ADD QUESTION
// ===============================
function addQuestion() {
    const container = document.getElementById('questions-container');

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';

    questionDiv.innerHTML = `
        <input type="text" placeholder="Question" class="input-field question-text">
        <input type="text" placeholder="Option A" class="input-field option">
        <input type="text" placeholder="Option B" class="input-field option">
        <input type="text" placeholder="Option C" class="input-field option">
        <input type="text" placeholder="Option D" class="input-field option">
        <select class="correct-answer">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
        </select>
        <button onclick="this.parentElement.remove()" class="btn-secondary" style="margin-top:10px;">
            Remove
        </button>
    `;

    container.appendChild(questionDiv);
}

// ===============================
// SAVE QUIZ
// ===============================
function saveQuiz() {
    const title = document.getElementById('quiz-title').value.trim();
    const timeLimit = document.getElementById('quiz-time').value;

    if (!title) {
        alert("Enter quiz title");
        return;
    }

    const questions = [];
    const questionItems = document.querySelectorAll('.question-item');

    questionItems.forEach(item => {
        const questionText = item.querySelector('.question-text').value;
        const options = Array.from(item.querySelectorAll('.option')).map(opt => opt.value);
        const correctAnswer = item.querySelector('.correct-answer').value;

        if (questionText && options.every(opt => opt)) {
            questions.push({
                text: questionText,
                options: options,
                correctAnswer: correctAnswer
            });
        }
    });

    if (questions.length === 0) {
        alert("Add at least one complete question");
        return;
    }

    db.collection('quizzes').add({
        title: title,
        timeLimit: parseInt(timeLimit),
        questions: questions,
        createdBy: currentAdmin.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("Quiz saved successfully!");
        clearQuizForm();
        loadAdminQuizzes();
        loadAnalytics();
    })
    .catch(error => alert(error.message));
}

// ===============================
// CLEAR FORM
// ===============================
function clearQuizForm() {
    document.getElementById('quiz-title').value = "";
    document.getElementById('quiz-time').value = "10";

    document.getElementById('questions-container').innerHTML = `
        <h3>Questions</h3>
        <div class="question-item">
            <input type="text" placeholder="Question" class="input-field question-text">
            <input type="text" placeholder="Option A" class="input-field option">
            <input type="text" placeholder="Option B" class="input-field option">
            <input type="text" placeholder="Option C" class="input-field option">
            <input type="text" placeholder="Option D" class="input-field option">
            <select class="correct-answer">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>
        </div>
    `;
}

// ===============================
// LOAD ADMIN QUIZZES
// ===============================
function loadAdminQuizzes() {
    const container = document.getElementById('quiz-items');
    container.innerHTML = "Loading...";

    db.collection('quizzes')
        .where('createdBy', '==', currentAdmin.email)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {

            if (snapshot.empty) {
                container.innerHTML = "<p>No quizzes created.</p>";
                return;
            }

            let html = "";

            snapshot.forEach(doc => {
                const quiz = doc.data();

                html += `
                    <div class="quiz-card">
                        <h3>${quiz.title}</h3>
                        <p>Time: ${quiz.timeLimit} min</p>
                        <p>Questions: ${quiz.questions.length}</p>
                        <button class="btn-secondary" onclick="deleteQuiz('${doc.id}')">
                            Delete
                        </button>
                    </div>
                `;
            });

            container.innerHTML = html;
        });
}

// ===============================
// DELETE QUIZ
// ===============================
function deleteQuiz(id) {

    if (!confirm("Are you sure you want to delete this quiz?")) return;

    db.collection('quizzes').doc(id).delete()
        .then(() => {
            alert("Quiz deleted!");
            loadAdminQuizzes();
            loadAnalytics();
        })
        .catch(error => alert(error.message));
}

// ===============================
// ANALYTICS
// ===============================
function loadAnalytics() {

    // Total Quizzes
    db.collection('quizzes')
        .where('createdBy', '==', currentAdmin.email)
        .get()
        .then(snapshot => {
            document.getElementById('total-quizzes').innerText = snapshot.size;
        });

    // Total Attempts
    db.collection('leaderboard')
        .get()
        .then(snapshot => {
            document.getElementById('total-attempts').innerText = snapshot.size;
        });
}