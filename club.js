const logosClubs = {
    "Real Madrid": "https://logo-marque.com/wp-content/uploads/2020/11/Real-Madrid-Logo.png",
    "AC Milan": "https://logo-marque.com/wp-content/uploads/2020/11/Milan-Logo.png",
    "Bayern Munich": "https://i.pinimg.com/736x/c3/8e/e4/c38ee43cecb122d4aea6091877cca1f4.jpg",
    "Liverpool": "https://static.vecteezy.com/ti/vecteur-libre/p1/26135429-liverpool-club-symbole-logo-premier-ligue-football-abstrait-conception-vecteur-illustration-gratuit-vectoriel.jpg",
    "Barcelone": "https://static.vecteezy.com/ti/vecteur-libre/p1/64548-fc-barcelona-gratuit-vectoriel.jpg",
    "Ajax": "https://thumbs.dreamstime.com/b/ajax-logo-120474526.jpg",
    "Manchester United": "https://dcassetcdn.com/design_img/138412/98654/98654_1846040_138412_image.png",
    "Inter Milan": "https://logos-marques.com/wp-content/uploads/2020/07/Inter-Milan-Logo.png",
    "PSG": "https://www.color-stickers.com/2150-thickbox_default/stickers-logo-foot-psg.jpg"
};

document.addEventListener('DOMContentLoaded', chargerPageClub);

function $(id) {
    return document.getElementById(id);
}

async function chargerPageClub() {
    try {
        const response = await fetch('/donnees.json');
        const donnees = await response.json();
        const statsParClub = construireDictionnaireClubs(donnees);
        const clubs = Object.keys(statsParClub).sort();
        const params = new URLSearchParams(window.location.search);
        const nomDemande = params.get('nom') || 'Real Madrid';
        const nomClub = statsParClub[nomDemande] ? nomDemande : clubs[0];

        remplirSelectClub(clubs, nomClub);
        afficherClub(statsParClub[nomClub]);
    } catch (error) {
        console.error('Erreur lors du chargement de la fiche club :', error);
        $('club-nom').textContent = 'Erreur de chargement';
        $('club-resume').textContent = "Impossible de charger les données du club.";
    }
}

function construireDictionnaireClubs(donnees) {
    const stats = {};

    function obtenirClub(nom, pays) {
        if (!stats[nom]) {
            stats[nom] = {
                nom,
                pays,
                titres: 0,
                finales: 0,
                anneesTitres: [],
                finalesJouees: []
            };
        }

        if (!stats[nom].pays && pays) {
            stats[nom].pays = pays;
        }

        return stats[nom];
    }

    donnees.forEach(edition => {
        const vainqueur = obtenirClub(edition.vainqueur, edition.pays_vainqueur);
        const finaliste = obtenirClub(edition.finaliste, edition.pays_finaliste);

        vainqueur.titres++;
        vainqueur.finales++;
        vainqueur.anneesTitres.push(Number(edition.annee));
        vainqueur.finalesJouees.push({
            annee: Number(edition.annee),
            adversaire: edition.finaliste,
            score: edition.score,
            lieu: edition.lieu,
            resultat: 'Victoire'
        });

        finaliste.finales++;
        finaliste.finalesJouees.push({
            annee: Number(edition.annee),
            adversaire: edition.vainqueur,
            score: edition.score,
            lieu: edition.lieu,
            resultat: 'Défaite'
        });
    });

    Object.values(stats).forEach(club => {
        club.anneesTitres.sort((a, b) => a - b);
        club.finalesJouees.sort((a, b) => a.annee - b.annee);
    });

    return stats;
}

function remplirSelectClub(clubs, nomClub) {
    const select = $('club-page-select');
    select.innerHTML = '';

    clubs.forEach(club => {
        const option = document.createElement('option');
        option.value = club;
        option.textContent = club;
        select.appendChild(option);
    });

    select.value = nomClub;
    select.addEventListener('change', function() {
        window.location.href = `/club.html?nom=${encodeURIComponent(this.value)}`;
    });
}

function afficherClub(club) {
    const defaites = club.finales - club.titres;
    const ratio = club.finales > 0 ? Math.round(club.titres / club.finales * 100) : 0;
    const dernierTitre = club.anneesTitres.length > 0 ? club.anneesTitres[club.anneesTitres.length - 1] : '-';

    document.title = `${club.nom} - Fiche club`;
    $('club-nom').textContent = club.nom;
    $('club-pays').textContent = club.pays || 'Pays non renseigné';
    $('club-logo').src = logosClubs[club.nom] || `https://via.placeholder.com/300x250?text=${encodeURIComponent(club.nom)}`;
    $('club-logo').alt = `Logo ${club.nom}`;
    $('club-resume').textContent = `${club.nom} compte ${club.titres} titre(s) en ${club.finales} finale(s) de Ligue des Champions.`;
    $('club-titres').textContent = club.titres;
    $('club-finales').textContent = club.finales;
    $('club-ratio').textContent = `${ratio}%`;
    $('club-derniere').textContent = dernierTitre;

    afficherAnneesTitres(club.anneesTitres);
    afficherMiniGraphique(club.titres, defaites);
    afficherTableTitres(club);
    afficherTableFinales(club);
}

function afficherAnneesTitres(annees) {
    const conteneur = $('club-annees');
    conteneur.innerHTML = '';

    if (annees.length === 0) {
        conteneur.innerHTML = '<p class="club-empty">Aucun titre remporté.</p>';
        return;
    }

    annees.forEach(annee => {
        const pill = document.createElement('span');
        pill.className = 'club-year-pill';
        pill.textContent = annee;
        conteneur.appendChild(pill);
    });
}

function afficherMiniGraphique(titres, defaites) {
    const maximum = Math.max(titres, defaites, 1);
    $('mini-victoires').style.width = `${titres / maximum * 100}%`;
    $('mini-defaites').style.width = `${defaites / maximum * 100}%`;
    $('mini-victoires-valeur').textContent = titres;
    $('mini-defaites-valeur').textContent = defaites;
}

function afficherTableTitres(club) {
    const tbody = $('club-titres-table');
    const titres = club.finalesJouees.filter(finale => finale.resultat === 'Victoire');

    tbody.innerHTML = titres.length === 0
        ? '<tr><td colspan="4" style="text-align: center;">Aucune finale remportée</td></tr>'
        : titres.map(finale => `
            <tr class="victoire">
                <td>${finale.annee}</td>
                <td>${finale.adversaire}</td>
                <td>${finale.score}</td>
                <td>${finale.lieu}</td>
            </tr>
        `).join('');
}

function afficherTableFinales(club) {
    const tbody = $('club-finales-table');

    tbody.innerHTML = club.finalesJouees.map(finale => {
        const classe = finale.resultat === 'Victoire' ? 'victoire' : 'defaite';
        return `
            <tr class="${classe}">
                <td>${finale.annee}</td>
                <td>${finale.resultat}</td>
                <td>${finale.adversaire}</td>
                <td>${finale.score}</td>
                <td>${finale.lieu}</td>
            </tr>
        `;
    }).join('');
}
