// Student session
let currentStudent = null;
let currentQuiz = null;
let quizStartTime = null;
let timerInterval = null;
let studentAnswers = [];

// Start anonymous session
function startAnonymousSession() {
    const studentName = document.getElementById('student-name').value;
    if (!studentName) {
        alert('Please enter your name');
        return;
    }
    
    auth.signInAnonymously()
        .then((userCredential) => {
            currentStudent = {
                uid: userCredential.user.uid,
                name: studentName
            };
            document.getElementById('student-info').classList.add('hidden');
            document.getElementById('available-quizzes').classList.remove('hidden');
            loadAvailableQuizzes();
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

// Load available quizzes
function loadAvailableQuizzes() {
    const quizList = document.getElementById('quiz-list');
    quizList.innerHTML = '<p>Loading quizzes...</p>';
    
    db.collection('quizzes')
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                quizList.innerHTML = '<p>No quizzes available.</p>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const quiz = doc.data();
                html += `
                    <div class="quiz-card" onclick="startQuiz('${doc.id}')">
                        <h3>${quiz.title}</h3>
                        <p>Time Limit: ${quiz.timeLimit} minutes</p>
                        <p>Questions: ${quiz.questions.length}</p>
                    </div>
                `;
            });
            quizList.innerHTML = html;
        })
        .catch((error) => {
            quizList.innerHTML = '<p>Error loading quizzes.</p>';
        });
}

// Start a quiz
function startQuiz(quizId) {
    db.collection('quizzes').doc(quizId).get()
        .then((doc) => {
            if (doc.exists) {
                currentQuiz = {
                    id: doc.id,
                    ...doc.data()
                };
                
                quizStartTime = new Date();
                studentAnswers = new Array(currentQuiz.questions.length).fill(null);
                
                document.getElementById('available-quizzes').classList.add('hidden');
                document.getElementById('quiz-area').classList.remove('hidden');
                
                displayQuiz();
                startTimer(currentQuiz.timeLimit * 60);
            }
        })
        .catch((error) => {
            alert('Error loading quiz: ' + error.message);
        });
}

// Display quiz questions
function displayQuiz() {
    document.getElementById('current-quiz-title').textContent = currentQuiz.title;
    
    const questionsArea = document.getElementById('questions-area');
    let html = '';
    
    currentQuiz.questions.forEach((question, index) => {
        html += `
            <div class="question-item">
                <h4>Question ${index + 1}: ${question.text}</h4>
                ${question.options.map((option, optIndex) => `
                    <label class="option-label">
                        <input type="radio" name="q${index}" value="${String.fromCharCode(65 + optIndex)}" 
                               onchange="saveAnswer(${index}, '${String.fromCharCode(65 + optIndex)}')">
                        ${String.fromCharCode(65 + optIndex)}. ${option}
                    </label>
                `).join('')}
            </div>
        `;
    });
    
    questionsArea.innerHTML = html;
}

// Save student answer
function saveAnswer(questionIndex, answer) {
    studentAnswers[questionIndex] = answer;
}

// Start timer
function startTimer(seconds) {
    const timerElement = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        if (seconds <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
        
        seconds--;
    }, 1000);
}

// Submit quiz
function submitQuiz() {
    clearInterval(timerInterval);
    
    // Calculate score
    let score = 0;
    currentQuiz.questions.forEach((question, index) => {
        if (studentAnswers[index] === question.correctAnswer) {
            score++;
        }
    });
    
    const totalQuestions = currentQuiz.questions.length;
    const percentage = (score / totalQuestions) * 100;
    
    // Save attempt to leaderboard
    const attempt = {
        studentName: currentStudent.name,
        studentId: currentStudent.uid,
        quizId: currentQuiz.id,
        quizTitle: currentQuiz.title,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('leaderboard').add(attempt)
        .then(() => {
            document.getElementById('quiz-area').classList.add('hidden');
            document.getElementById('results-area').classList.remove('hidden');
            
            document.getElementById('score-display').innerHTML = `
                <h3>Your Score: ${score}/${totalQuestions}</h3>
                <p>Percentage: ${percentage.toFixed(1)}%</p>
            `;
        })
        .catch((error) => {
            alert('Error saving results: ' + error.message);
        });
}