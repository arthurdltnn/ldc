/**
 * SCRIPT JAVASCRIPT - UEFA Champions League
 * Gestion du DOM, fetch des données, événements, animations
 * Récupère les données depuis /donnees.json (serveur Python)
 */

// Données globales
let donnees = [];
let donneesClubs = {};
let quizIndex = 0;
let quizScore = 0;
let selectedAnswers = {};
let triActuel = { colonne: 'annee', asc: true };

// Questions du quiz
const quiz = [
    {
        question: "En quelle année la Coupe des clubs champions a-t-elle été créée ?",
        options: ["1950", "1960", "1955", "1965"],
        reponse: 2
    },
    {
        question: "Quel club a remporté les 5 premières éditions consécutives ?",
        options: ["AC Milan", "Bayern Munich", "Real Madrid", "Liverpool"],
        reponse: 2
    },
    {
        question: "Quel est le score de la plus grande victoire en finale UCL ?",
        options: ["5-0", "6-2", "7-3", "8-2"],
        reponse: 0
    },
    {
        question: "En quelle année la compétition a-t-elle été transformée en 'Champions League' ?",
        options: ["1989", "1991", "1992", "1995"],
        reponse: 2
    },
    {
        question: "Quel club compte le plus de titres en 2025 ?",
        options: ["Bayern Munich", "AC Milan", "Real Madrid", "Liverpool"],
        reponse: 2
    }
];

// ============ INITIALISATION ============
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Chargement du site Champions League...');
    
    // Récupération des données depuis le serveur
    await chargerDonnees();
    
    // Initialisation des sections
    afficherPalmares();
    afficherClubs();
    initialiserComparateur();
    initialiserQuiz();
    
    // Événements
    document.getElementById('searchInput').addEventListener('input', filtrerPalmares);
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function() {
            trierTableau(this.dataset.column);
        });
    });
    document.querySelectorAll('.sort-btn').forEach(button => {
        button.addEventListener('click', function() {
            trierTableau(this.dataset.sort);
        });
    });
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const section = document.querySelector(this.getAttribute('href'));
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Gestion du formulaire de contact
    document.getElementById('contact-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Envoi...';

        try {
            const response = await fetch(this.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: new URLSearchParams(new FormData(this))
            });

            if (!response.ok) {
                throw new Error('Réponse serveur invalide');
            }

            this.reset();
            this.style.display = 'none';
            document.getElementById('contact-confirmation').style.display = 'block';
        } catch (error) {
            console.error('Erreur lors de l’envoi du message :', error);
            alert("Impossible d'envoyer le message pour le moment. Vérifiez que le serveur Python est lancé.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Envoyer';
        }
    });
});

// ============ CHARGEMENT DES DONNÉES ============
async function chargerDonnees() {
    try {
        const response = await fetch('/donnees.json');
        donnees = await response.json();
        console.log('✅ Données chargées :', donnees.length, 'éditions');
        
        // Traitement des données pour calculer les statistiques
        calculerStatistiquesClubs();
        mettreAJourStatsHero();
        afficherStatistiques();
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données :', error);
        document.getElementById('palmares-tbody').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; color: red;">Erreur lors du chargement des données</td></tr>';
    }
}

// ============ OUTILS DE DONNÉES ============
function extraireScorePrincipal(score) {
    const match = String(score).match(/(\d+)\s*-\s*(\d+)/);
    return match ? [Number(match[1]), Number(match[2])] : null;
}

function calculerEcartScore(score) {
    const scorePrincipal = extraireScorePrincipal(score);
    return scorePrincipal ? Math.abs(scorePrincipal[0] - scorePrincipal[1]) : -1;
}

function mettreAJourStatsHero() {
    const clubsVainqueurs = new Set(donnees.map(edition => edition.vainqueur));
    const paysVainqueurs = new Set(donnees.map(edition => edition.pays_vainqueur));

    document.getElementById('nb-editions').textContent = donnees.length;
    document.getElementById('nb-clubs').textContent = clubsVainqueurs.size;
    document.getElementById('nb-pays').textContent = paysVainqueurs.size;
}

// ============ AFFICHAGE DU PALMARÈS ============
function afficherPalmares() {
    const tbody = document.getElementById('palmares-tbody');
    tbody.innerHTML = '';
    
    donnees.forEach((edition, index) => {
        const row = document.createElement('tr');
        
        // Déterminer si c'est un top club (pour coloration)
        const isTopClub = parseInt(edition.nb_titres_cumulés) >= 3;
        if (isTopClub) {
            row.classList.add('top-club');
        }
        
        row.innerHTML = `
            <td>${edition.annee}</td>
            <td><strong>${edition.vainqueur}</strong></td>
            <td>${edition.finaliste}</td>
            <td>${edition.score}</td>
            <td>${edition.lieu}</td>
        `;
        tbody.appendChild(row);
    });
}

// ============ RECHERCHE ET FILTRAGE ============
function filtrerPalmares() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#palmares-tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ============ TRI DU TABLEAU ============
function trierTableau(colonne) {
    if (triActuel.colonne === colonne) {
        triActuel.asc = !triActuel.asc;
    } else {
        triActuel.colonne = colonne;
        triActuel.asc = true;
    }
    
    donnees.sort((a, b) => {
        let valA = a[colonne];
        let valB = b[colonne];
        
        // Conversion en nombres si possible
        if (!isNaN(valA)) valA = parseInt(valA);
        if (!isNaN(valB)) valB = parseInt(valB);
        
        if (triActuel.asc) {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });
    
    afficherPalmares();
}

// ============ CALCUL DES STATISTIQUES CLUBS ============
function calculerStatistiquesClubs() {
    donneesClubs = {};

    function obtenirClub(nom, pays = '') {
        if (!donneesClubs[nom]) {
            donneesClubs[nom] = {
                nom,
                titres: 0,
                finales: 0,
                derniereTitre: null,
                derniereFinale: null,
                pays
            };
        }

        if (!donneesClubs[nom].pays && pays) {
            donneesClubs[nom].pays = pays;
        }

        return donneesClubs[nom];
    }
    
    donnees.forEach(edition => {
        const annee = parseInt(edition.annee);
        const vainqueur = obtenirClub(edition.vainqueur, edition.pays_vainqueur);
        const finaliste = obtenirClub(edition.finaliste, edition.pays_finaliste);

        vainqueur.titres++;
        vainqueur.finales++;
        vainqueur.derniereTitre = annee;
        vainqueur.derniereFinale = annee;

        finaliste.finales++;
        finaliste.derniereFinale = annee;
    });
}

// ============ AFFICHAGE DES CLUBS LÉGENDAIRES ============
function afficherClubs() {
    const clubsLegendes = [
        { nom: "Real Madrid", titres: 15, pays: "Espagne", img: "https://logo-marque.com/wp-content/uploads/2020/11/Real-Madrid-Logo.png" },
        { nom: "AC Milan", titres: 7, pays: "Italie", img: "https://logo-marque.com/wp-content/uploads/2020/11/Milan-Logo.png" },
        { nom: "Bayern Munich", titres: 6, pays: "Allemagne", img: "https://i.pinimg.com/736x/c3/8e/e4/c38ee43cecb122d4aea6091877cca1f4.jpg" },
        { nom: "Liverpool", titres: 6, pays: "Angleterre", img: "https://static.vecteezy.com/ti/vecteur-libre/p1/26135429-liverpool-club-symbole-logo-premier-ligue-football-abstrait-conception-vecteur-illustration-gratuit-vectoriel.jpg" },
        { nom: "Barcelone", titres: 5, pays: "Espagne", img: "https://static.vecteezy.com/ti/vecteur-libre/p1/64548-fc-barcelona-gratuit-vectoriel.jpg" },
        { nom: "Ajax", titres: 4, pays: "Pays-Bas", img: "https://thumbs.dreamstime.com/b/ajax-logo-120474526.jpg" },
        { nom: "Manchester United", titres: 3, pays: "Angleterre", img: "https://dcassetcdn.com/design_img/138412/98654/98654_1846040_138412_image.png" },
        { nom: "Inter Milan", titres: 3, pays: "Italie", img: "https://logos-marques.com/wp-content/uploads/2020/07/Inter-Milan-Logo.png" },
        { nom: "PSG", titres: 1, pays: "France", img: "https://www.color-stickers.com/2150-thickbox_default/stickers-logo-foot-psg.jpg" }
    ];
    
    const grid = document.getElementById('clubs-grid');
    grid.innerHTML = '';
    
    clubsLegendes.forEach(club => {
        const statsClub = donneesClubs[club.nom] || {
            titres: club.titres,
            finales: club.titres,
            pays: club.pays
        };
        const card = document.createElement('div');
        card.className = 'club-card';
        card.innerHTML = `
            <img src="${club.img}" alt="${club.nom}" class="club-card-img" onerror="this.src='https://via.placeholder.com/300x250?text=${encodeURIComponent(club.nom)}'">
            <div class="club-card-content">
                <h3 class="club-card-title">${club.nom}</h3>
                <p class="club-card-pays">🌍 ${club.pays}</p>
                <div class="club-stat">
                    <span class="club-stat-label">Titres UCL :</span>
                    <span class="club-stat-value">${statsClub.titres}</span>
                </div>
                <div class="club-stat">
                    <span class="club-stat-label">Finales :</span>
                    <span class="club-stat-value">${statsClub.finales}</span>
                </div>
                <a class="club-card-link" href="/club.html?nom=${encodeURIComponent(club.nom)}">Voir la fiche</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ============ INITIALISATION COMPARATEUR ============
function initialiserComparateur() {
    const select1 = document.getElementById('club1');
    const select2 = document.getElementById('club2');
    select1.innerHTML = '';
    select2.innerHTML = '';
    
    const clubs = Object.keys(donneesClubs).sort();
    
    clubs.forEach(club => {
        const option1 = document.createElement('option');
        option1.value = club;
        option1.textContent = club;
        select1.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = club;
        option2.textContent = club;
        select2.appendChild(option2);
    });
    
    // Sélections par défaut
    if (clubs.length >= 2) {
        select1.value = clubs.includes('Real Madrid') ? 'Real Madrid' : clubs[0];
        select2.value = clubs.includes('AC Milan') ? 'AC Milan' : clubs[1];
    }
}

// ============ COMPARAISON DE CLUBS ============
function comparerClubs() {
    const club1 = document.getElementById('club1').value;
    const club2 = document.getElementById('club2').value;
    
    if (!club1 || !club2) {
        alert('Veuillez sélectionner deux clubs');
        return;
    }
    
    const data1 = donneesClubs[club1];
    const data2 = donneesClubs[club2];
    
    if (!data1 || !data2) {
        alert('Clubs non trouvés dans les données');
        return;
    }
    
    // Affichage des résultats
    const maxTitres = Math.max(data1.titres, data2.titres, 1);
    const detailClub1 = data1.derniereTitre ? `Dernier titre : ${data1.derniereTitre}` : `Dernière finale : ${data1.derniereFinale}`;
    const detailClub2 = data2.derniereTitre ? `Dernier titre : ${data2.derniereTitre}` : `Dernière finale : ${data2.derniereFinale}`;
    
    document.getElementById('club1-nom').textContent = data1.nom;
    document.getElementById('club1-titres').textContent = data1.titres;
    document.getElementById('club1-finales').textContent = `${data1.finales} finales`;
    document.getElementById('club1-derniere').textContent = detailClub1;
    document.getElementById('club1-progress').style.width = (data1.titres / maxTitres * 100) + '%';
    
    document.getElementById('club2-nom').textContent = data2.nom;
    document.getElementById('club2-titres').textContent = data2.titres;
    document.getElementById('club2-finales').textContent = `${data2.finales} finales`;
    document.getElementById('club2-derniere').textContent = detailClub2;
    document.getElementById('club2-progress').style.width = (data2.titres / maxTitres * 100) + '%';
    
    document.getElementById('comparaison-resultat').style.display = 'block';
}

// ============ AFFICHAGE DES STATISTIQUES ============
function afficherStatistiques() {
    // Club le plus titré
    let topClub = null;
    let maxTitres = 0;
    
    Object.values(donneesClubs).filter(club => club.titres > 0).forEach(club => {
        if (club.titres > maxTitres) {
            maxTitres = club.titres;
            topClub = club;
        }
    });
    
    document.getElementById('record-club').textContent = topClub.nom;
    document.getElementById('record-titres').textContent = topClub.titres + ' titres';
    
    // Pays le plus représenté
    const paysCounts = {};
    Object.values(donneesClubs).filter(club => club.titres > 0).forEach(club => {
        paysCounts[club.pays] = (paysCounts[club.pays] || 0) + club.titres;
    });
    
    let topPays = null;
    let maxPays = 0;
    Object.entries(paysCounts).forEach(([pays, count]) => {
        if (count > maxPays) {
            maxPays = count;
            topPays = pays;
        }
    });
    
    document.getElementById('record-pays').textContent = topPays;
    document.getElementById('record-pays-count').textContent = maxPays + ' titres';
    
    // Plus grande victoire
    const plusGrande = donnees.reduce((max, edition) => {
        return calculerEcartScore(edition.score) > calculerEcartScore(max.score) ? edition : max;
    });
    
    document.getElementById('record-victoire').textContent = plusGrande.score;
    document.getElementById('record-victoire-detail').textContent = 
        `${plusGrande.vainqueur} ${plusGrande.annee}`;
    
    // Graphique - Top 10 clubs
    afficherGraphique();
}

// ============ GRAPHIQUE TOP 10 ============
function afficherGraphique() {
    const top10 = Object.values(donneesClubs)
        .filter(club => club.titres > 0)
        .sort((a, b) => b.titres - a.titres)
        .slice(0, 10);
    
    const chart = document.getElementById('chart');
    chart.innerHTML = '';
    
    const maxTitres = top10[0].titres;
    
    top10.forEach(club => {
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar';

        const barArea = document.createElement('div');
        barArea.className = 'bar-area';
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = (club.titres / maxTitres * 100) + '%';
        bar.title = `${club.nom}: ${club.titres} titres`;

        const value = document.createElement('span');
        value.className = 'bar-value';
        value.textContent = club.titres;
        bar.appendChild(value);
        
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = club.nom;
        
        barArea.appendChild(bar);
        barContainer.appendChild(barArea);
        barContainer.appendChild(label);
        chart.appendChild(barContainer);
    });
}

// ============ INITIALISATION DU QUIZ ============
function initialiserQuiz() {
    afficherQuestionQuiz();
}

// ============ AFFICHAGE QUESTION QUIZ ============
function afficherQuestionQuiz() {
    if (quizIndex >= quiz.length) {
        afficherResultatQuiz();
        return;
    }
    
    const question = quiz[quizIndex];
    const reponseChoisie = selectedAnswers[quizIndex];
    const questionDejaRepondue = reponseChoisie !== undefined;
    document.getElementById('quiz-question-text').textContent = question.question;
    
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const btn = document.createElement('div');
        btn.className = 'quiz-option';
        btn.textContent = option;
        btn.onclick = () => selectionnerReponse(index);
        
        if (questionDejaRepondue) {
            btn.classList.add('revealed');
            if (index === question.reponse) {
                btn.classList.add('correct');
            } else if (index === reponseChoisie) {
                btn.classList.add('incorrect');
            }
        }
        
        optionsContainer.appendChild(btn);
    });
    
    const boutonSuivant = document.querySelector('#quiz-container .btn-quiz');
    boutonSuivant.textContent = 
        quizIndex === quiz.length - 1 ? 'Voir Résultat' : 'Question Suivante';
    boutonSuivant.disabled = !questionDejaRepondue;

    const feedback = document.getElementById('quiz-feedback');
    if (questionDejaRepondue) {
        const bonneReponse = question.options[question.reponse];
        const estCorrect = reponseChoisie === question.reponse;
        feedback.textContent = estCorrect
            ? `Bonne réponse : ${bonneReponse}`
            : `Mauvaise réponse. La bonne réponse était : ${bonneReponse}`;
        feedback.className = estCorrect ? 'quiz-feedback correct' : 'quiz-feedback incorrect';
    } else {
        feedback.textContent = '';
        feedback.className = 'quiz-feedback';
    }
}

// ============ SÉLECTION RÉPONSE QUIZ ============
function selectionnerReponse(index) {
    if (selectedAnswers[quizIndex] !== undefined) {
        return;
    }

    selectedAnswers[quizIndex] = index;
    afficherQuestionQuiz();
}

// ============ QUESTION SUIVANTE ============
function nextQuestion() {
    if (selectedAnswers[quizIndex] === undefined) {
        alert('Veuillez sélectionner une réponse avant de continuer.');
        return;
    }

    quizIndex++;
    if (quizIndex < quiz.length) {
        afficherQuestionQuiz();
    } else {
        afficherResultatQuiz();
    }
}

// ============ AFFICHAGE RÉSULTAT QUIZ ============
function afficherResultatQuiz() {
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('quiz-result').style.display = 'block';
    
    quizScore = quiz.reduce((score, question, index) => {
        return selectedAnswers[index] === question.reponse ? score + 1 : score;
    }, 0);

    const pourcentage = Math.round(quizScore / quiz.length * 100);
    document.getElementById('quiz-score-text').textContent = `${quizScore}/${quiz.length} (${pourcentage}%)`;
    
    let message = '';
    if (pourcentage >= 80) {
        message = '🏆 Excellent ! Vous êtes un véritable fan de la Champions League !';
    } else if (pourcentage >= 60) {
        message = '👏 Très bien ! Vous connaissez bien l\'histoire de la Champions League !';
    } else if (pourcentage >= 40) {
        message = '📚 Pas mal ! Continuez à découvrir l\'univers de la Champions League !';
    } else {
        message = '📖 À bientôt ! Découvrez plus sur la Champions League !';
    }
    
    document.getElementById('quiz-message-text').textContent = message;
}

// ============ RECOMMENCER QUIZ ============
function recommencerQuiz() {
    quizIndex = 0;
    quizScore = 0;
    selectedAnswers = {};
    
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('quiz-result').style.display = 'none';
    
    afficherQuestionQuiz();
}

console.log('✅ Script Champions League chargé avec succès');
