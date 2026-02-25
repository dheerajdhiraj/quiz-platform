// Admin authentication state
let currentAdmin = null;

// Check auth state
auth.onAuthStateChanged((user) => {
    if (user) {
        currentAdmin = user;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('quiz-creation-section').classList.remove('hidden');
        document.getElementById('quizzes-list').classList.remove('hidden');
        loadAdminQuizzes();
    } else {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('quiz-creation-section').classList.add('hidden');
        document.getElementById('quizzes-list').classList.add('hidden');
    }
});

// Admin signup
function adminSignup() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('Account created successfully!');
        })
        .catch((error) => {
            alert(error.message);
        });
}

// Admin login
function adminLogin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            alert(error.message);
        });
}

// Add question field
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
    `;
    container.appendChild(questionDiv);
}

// Save quiz to Firestore
function saveQuiz() {
    const title = document.getElementById('quiz-title').value;
    const timeLimit = document.getElementById('quiz-time').value;
    
    if (!title) {
        alert('Please enter a quiz title');
        return;
    }
    
    const questions = [];
    const questionItems = document.querySelectorAll('.question-item');
    
    for (let item of questionItems) {
        const questionText = item.querySelector('.question-text').value;
        const options = [
            item.querySelectorAll('.option')[0].value,
            item.querySelectorAll('.option')[1].value,
            item.querySelectorAll('.option')[2].value,
            item.querySelectorAll('.option')[3].value
        ];
        const correctAnswer = item.querySelector('.correct-answer').value;
        
        if (questionText && options.every(opt => opt)) {
            questions.push({
                text: questionText,
                options: options,
                correctAnswer: correctAnswer
            });
        }
    }
    
    if (questions.length === 0) {
        alert('Please add at least one question');
        return;
    }
    
    const quiz = {
        title: title,
        timeLimit: parseInt(timeLimit),
        questions: questions,
        createdBy: currentAdmin.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('quizzes').add(quiz)
        .then(() => {
            alert('Quiz saved successfully!');
            clearQuizForm();
            loadAdminQuizzes();
        })
        .catch((error) => {
            alert('Error saving quiz: ' + error.message);
        });
}

// Clear quiz form
function clearQuizForm() {
    document.getElementById('quiz-title').value = '';
    document.getElementById('quiz-time').value = '10';
    document.getElementById('questions-container').innerHTML = `
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

// Load admin's quizzes
function loadAdminQuizzes() {
    const quizzesList = document.getElementById('quiz-items');
    quizzesList.innerHTML = '<p>Loading quizzes...</p>';
    
    db.collection('quizzes')
        .where('createdBy', '==', currentAdmin.email)
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                quizzesList.innerHTML = '<p>No quizzes created yet.</p>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const quiz = doc.data();
                html += `
                    <div class="quiz-card">
                        <h3>${quiz.title}</h3>
                        <p>Time Limit: ${quiz.timeLimit} minutes</p>
                        <p>Questions: ${quiz.questions.length}</p>
                    </div>
                `;
            });
            quizzesList.innerHTML = html;
        })
        .catch((error) => {
            quizzesList.innerHTML = '<p>Error loading quizzes.</p>';
        });
}