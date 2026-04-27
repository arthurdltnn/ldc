#!/usr/bin/env python3
"""
Serveur HTTP pour le projet UEFA Champions League
Architecture : http.server avec BaseHTTPRequestHandler
Routes : GET /, GET /donnees.json, GET /style.css, GET /script.js, POST /contact
Données : lecture depuis donnees_ldc.csv
"""

import http.server
import urllib.parse
import json
import csv
import os
from datetime import datetime

# Configuration du serveur
HOST = 'localhost'
PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def chemin_projet(nom_fichier):
    """Retourne le chemin absolu d'un fichier du projet."""
    return os.path.join(BASE_DIR, nom_fichier)

class ChampionsLeagueHandler(http.server.BaseHTTPRequestHandler):
    """Gestionnaire des requêtes HTTP pour l'application Champions League"""
    
    def do_GET(self):
        """Traite les requêtes GET"""
        route = urllib.parse.urlparse(self.path).path
        
        # Route : Page principale (index.html)
        if route == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            with open(chemin_projet('index.html'), 'r', encoding='utf-8') as f:
                self.wfile.write(f.read().encode('utf-8'))

        # Route : Page exemple d'un club
        elif route == '/club.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            with open(chemin_projet('club.html'), 'r', encoding='utf-8') as f:
                self.wfile.write(f.read().encode('utf-8'))
        
        # Route : Données JSON depuis CSV
        elif route == '/donnees.json':
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            
            donnees = []
            try:
                with open(chemin_projet('donnees_ldc.csv'), 'r', encoding='utf-8') as f:
                    lecteur = csv.DictReader(f, delimiter=';')
                    for ligne in lecteur:
                        donnees.append({
                            'edition': ligne['edition'],
                            'annee': ligne['annee'],
                            'vainqueur': ligne['vainqueur'],
                            'finaliste': ligne['finaliste'],
                            'score': ligne['score'],
                            'lieu': ligne['lieu'],
                            'buts_vainqueur': ligne['buts_vainqueur'],
                            'pays_vainqueur': ligne['pays_vainqueur'],
                            'pays_finaliste': ligne['pays_finaliste'],
                            'nb_titres_cumulés': ligne['nb_titres_cumulés']
                        })
            except FileNotFoundError:
                donnees = []
            
            json_data = json.dumps(donnees, ensure_ascii=False, indent=2)
            self.wfile.write(json_data.encode('utf-8'))
        
        # Route : Feuille de style CSS
        elif route == '/style.css':
            self.send_response(200)
            self.send_header('Content-type', 'text/css; charset=utf-8')
            self.end_headers()
            with open(chemin_projet('style.css'), 'r', encoding='utf-8') as f:
                self.wfile.write(f.read().encode('utf-8'))

        # Route : Feuille de style des fiches clubs
        elif route == '/club.css':
            self.send_response(200)
            self.send_header('Content-type', 'text/css; charset=utf-8')
            self.end_headers()
            with open(chemin_projet('club.css'), 'r', encoding='utf-8') as f:
                self.wfile.write(f.read().encode('utf-8'))
        
        # Route : Script JavaScript
        elif route == '/script.js':
            self.send_response(200)
            self.send_header('Content-type', 'application/javascript; charset=utf-8')
            self.end_headers()
            with open(chemin_projet('script.js'), 'r', encoding='utf-8') as f:
                self.wfile.write(f.read().encode('utf-8'))

        # Route : Script JavaScript des fiches clubs
        elif route == '/club.js':
            self.send_response(200)
            self.send_header('Content-type', 'application/javascript; charset=utf-8')
            self.end_headers()
            with open(chemin_projet('club.js'), 'r', encoding='utf-8') as f:
                self.wfile.write(f.read().encode('utf-8'))
        
        # Route non trouvée
        else:
            self.send_response(404)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'<h1>404 - Page non trouvee</h1>')
    
    def do_POST(self):
        """Traite les requêtes POST (formulaire de contact)"""
        
        if self.path == '/contact':
            # Lecture du contenu POST
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            params = urllib.parse.parse_qs(post_data, encoding='utf-8')
            
            # Extraction des données du formulaire
            prenom = params.get('prenom', [''])[0]
            email = params.get('email', [''])[0]
            message = params.get('message', [''])[0]
            
            # Enregistrement dans le fichier messages.txt
            with open(chemin_projet('messages.txt'), 'a', encoding='utf-8') as f:
                f.write(f"\n--- Message du {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---\n")
                f.write(f"Prénom: {prenom}\n")
                f.write(f"Email: {email}\n")
                f.write(f"Message: {message}\n")
            
            # Redirection 303 vers la page d'accueil
            self.send_response(303)
            self.send_header('Location', '/')
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        """Personnalise les logs du serveur"""
        print(f"[{self.log_date_time_string()}] {format % args}")


def demarrer_serveur():
    """Lance le serveur HTTP"""
    adresse = (HOST, PORT)
    serveur = http.server.HTTPServer(adresse, ChampionsLeagueHandler)
    print(f"Serveur lance sur http://{HOST}:{PORT}")
    print("Appuyez sur Ctrl+C pour arreter le serveur")
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print("\nServeur arrete")
        serveur.server_close()


if __name__ == '__main__':
    demarrer_serveur()
