let currentStudent = null;
let currentQuiz = null;
let studentAnswers = [];
let currentIndex = 0;
let timerInterval = null;

// Sound Effects
const clickSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3");
const successSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3");

// Theme Toggle
function toggleTheme(){
    document.body.classList.toggle("light-mode");
}

// Start Session
function startAnonymousSession(){
    const name = document.getElementById("student-name").value;
    if(!name) return alert("Enter your name");

    auth.signInAnonymously().then(user=>{
        currentStudent={uid:user.user.uid,name};
        document.getElementById("student-info").classList.add("hidden");
        document.getElementById("available-quizzes").classList.remove("hidden");
        loadAvailableQuizzes();
    });
}

// Load Quizzes
function loadAvailableQuizzes(){
    db.collection("quizzes").get().then(snapshot=>{
        let html="";
        snapshot.forEach(doc=>{
            const q=doc.data();
            html+=`
            <div class="quiz-card glass" onclick="startQuiz('${doc.id}')">
                <h3>${q.title}</h3>
                <p>${q.questions.length} Questions</p>
            </div>`;
        });
        document.getElementById("quiz-list").innerHTML=html;
    });
}

// Start Quiz
function startQuiz(id){
    db.collection("quizzes").doc(id).get().then(doc=>{
        currentQuiz={id:doc.id,...doc.data()};
        studentAnswers=new Array(currentQuiz.questions.length).fill(null);

        document.getElementById("available-quizzes").classList.add("hidden");
        document.getElementById("quiz-area").classList.remove("hidden");

        buildNavigator();
        showQuestion(0);
        startTimer(currentQuiz.timeLimit*60);
    });
}

// Navigator
function buildNavigator(){
    const nav=document.getElementById("question-navigation");
    nav.innerHTML="";
    currentQuiz.questions.forEach((_,i)=>{
        nav.innerHTML+=`<button onclick="showQuestion(${i})">${i+1}</button>`;
    });
}

// Show Question
function showQuestion(index){
    clickSound.play();
    currentIndex=index;
    const q=currentQuiz.questions[index];

    document.getElementById("questions-area").innerHTML=`
    <div class="question-item glass">
        <h3>Question ${index+1}</h3>
        <p>${q.text}</p>
        ${q.options.map((opt,i)=>`
        <label class="option-label">
            <input type="radio" name="q"
            value="${String.fromCharCode(65+i)}"
            ${studentAnswers[index]===String.fromCharCode(65+i)?"checked":""}
            onchange="saveAnswer(${index},'${String.fromCharCode(65+i)}')">
            ${opt}
        </label>`).join("")}
    </div>`;

    updateProgress();
}

// Save Answer + Auto Save
function saveAnswer(i,val){
    studentAnswers[i]=val;
    localStorage.setItem("quiz-progress",JSON.stringify(studentAnswers));
    updateProgress();
}

// Progress
function updateProgress(){
    const answered=studentAnswers.filter(a=>a!==null).length;
    const total=currentQuiz.questions.length;
    const percent=(answered/total)*100;

    document.getElementById("progress").style.width=percent+"%";
    document.getElementById("progress-text").innerText=
        `${answered}/${total} Answered`;
}

// Timer
function startTimer(seconds){
    timerInterval=setInterval(()=>{
        const m=Math.floor(seconds/60);
        const s=seconds%60;

        document.getElementById("timer").innerText=
        `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

        if(seconds<30){
            document.getElementById("timer-box").classList.add("warning");
        }

        if(seconds<=0){
            clearInterval(timerInterval);
            submitQuiz();
        }
        seconds--;
    },1000);
}

// Review
function reviewQuiz(){
    document.getElementById("quiz-area").classList.add("hidden");
    document.getElementById("review-area").classList.remove("hidden");

    let html="";
    studentAnswers.forEach((ans,i)=>{
        html+=`<p>Question ${i+1}: ${ans?ans:"Not Answered"}</p>`;
    });
    document.getElementById("review-list").innerHTML=html;
}

// Submit
function submitQuiz(){
    clearInterval(timerInterval);
    successSound.play();

    let score=0;
    currentQuiz.questions.forEach((q,i)=>{
        if(studentAnswers[i]===q.correctAnswer) score++;
    });

    const total=currentQuiz.questions.length;
    const percent=((score/total)*100).toFixed(1);

    db.collection("leaderboard").add({
        studentName:currentStudent.name,
        quizId:currentQuiz.id,
        quizTitle:currentQuiz.title,
        score,
        totalQuestions:total,
        percentage:parseFloat(percent),
        timestamp:firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("review-area").classList.add("hidden");
    document.getElementById("quiz-area").classList.add("hidden");
    document.getElementById("results-area").classList.remove("hidden");

    document.getElementById("score-display").innerHTML=
        `<h2>${score}/${total}</h2><p>${percent}%</p>`;

    if(percent>=80) launchConfetti();
}

// Confetti
function launchConfetti(){
    for(let i=0;i<150;i++){
        const conf=document.createElement("div");
        conf.className="confetti";
        conf.style.left=Math.random()*100+"vw";
        conf.style.background=`hsl(${Math.random()*360},100%,50%)`;
        document.body.appendChild(conf);
        setTimeout(()=>conf.remove(),4000);
    }
}