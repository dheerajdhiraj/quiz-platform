// Load leaderboard data
function loadLeaderboard() {
    const quizSelect = document.getElementById('quiz-select');
    const selectedQuiz = quizSelect.value;
    
    const leaderboardBody = document.getElementById('leaderboard-body');
    leaderboardBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    
    let query = db.collection('leaderboard')
        .orderBy('score', 'desc')
        .orderBy('timestamp', 'desc');
    
    if (selectedQuiz) {
        query = query.where('quizId', '==', selectedQuiz);
    }
    
    query.get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                leaderboardBody.innerHTML = '<tr><td colspan="5">No attempts yet.</td></tr>';
                return;
            }
            
            let rank = 1;
            let html = '';
            querySnapshot.forEach((doc) => {
                const attempt = doc.data();
                const date = attempt.timestamp ? new Date(attempt.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
                
                html += `
                    <tr>
                        <td>${rank}</td>
                        <td>${attempt.studentName || 'Anonymous'}</td>
                        <td>${attempt.quizTitle || 'Unknown Quiz'}</td>
                        <td>${attempt.score}/${attempt.totalQuestions} (${attempt.percentage?.toFixed(1) || 0}%)</td>
                        <td>${date}</td>
                    </tr>
                `;
                rank++;
            });
            leaderboardBody.innerHTML = html;
        })
        .catch((error) => {
            leaderboardBody.innerHTML = '<tr><td colspan="5">Error loading leaderboard.</td></tr>';
        });
}

// Load quizzes for dropdown
function loadQuizOptions() {
    const quizSelect = document.getElementById('quiz-select');
    
    db.collection('quizzes').get()
        .then((querySnapshot) => {
            let options = '<option value="">All Quizzes</option>';
            querySnapshot.forEach((doc) => {
                const quiz = doc.data();
                options += `<option value="${doc.id}">${quiz.title}</option>`;
            });
            quizSelect.innerHTML = options;
        })
        .catch((error) => {
            console.error('Error loading quizzes:', error);
        });
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadQuizOptions();
    loadLeaderboard();
});