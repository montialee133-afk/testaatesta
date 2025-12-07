Documento di Progetto: "Testa a Testa"
Obiettivo: Creare un quiz 1vs1 dove l'host (chi crea) e il guest (chi partecipa) si sincronizzano istantaneamente tramite un codice breve.

1. Il Flusso di Utilizzo (User Journey)
Questa è la logica fondamentale dell'applicazione. Non c'è registrazione, non c'è login. Tutto è "usa e getta".

Fase A: La Creazione (Telefono 1 - "L'Host")
L'utente apre il sito.

Sceglie un argomento (es. "Harry Potter") e preme "CREA PARTITA".

Il server crea una "stanza privata" e genera un codice univoco (es. XJ9K).

Sul Telefono 1 appare una schermata di attesa: "Codice Stanza: XJ9K - In attesa dell'avversario...".

Fase B: L'Unione (Telefono 2 - "Il Guest")
L'amico apre lo stesso sito sul suo telefono.

Invece di creare, preme "UNISCITI".

Inserisce il codice XJ9K che legge dal telefono dell'amico.

Il server controlla il codice. Se è corretto, "immette" il Telefono 2 nella stanza del Telefono 1.

Fase C: La Sincronizzazione (Entrambi)
Appena il Telefono 2 entra, il server fa scattare l'inizio della partita su entrambi i telefoni contemporaneamente.

L'AI genera la domanda e la invia a tutti e due nello stesso millisecondo.

2. Architettura Tecnica (Come funziona "sotto il cofano")
Per realizzare questo sistema servono 3 componenti che lavorano insieme:

A. Il Cervello Centrale (Server Node.js + Socket.io)
È il vigile urbano. Non salva nulla su database, tiene tutto nella memoria RAM finché la partita è attiva.

Ruolo: Gestisce le "Rooms" (Stanze).

Logica: Quando l'Utente 1 si connette, il server gli assegna un ID (socket.id). Quando crea la partita, il server crea un gruppo virtuale chiamato "XJ9K". Quando l'Utente 2 invia "XJ9K", il server lo aggiunge a quel gruppo specifico.

B. Il Generatore di Contenuti (Google Gemini API)
È l'autore delle domande. Viene chiamato dal Server, non dai telefoni (per sicurezza).

Ruolo: Riceve un argomento, restituisce un JSON con domanda e opzioni.

C. L'Interfaccia (Frontend React)
È quello che vedono gli utenti. Deve essere reattiva: quando il server dice "Nuova domanda", lo schermo deve cambiare all'istante senza ricaricare la pagina.

3. Specifiche Tecniche Minime (MVP)
Stack Tecnologico
Backend: Node.js con libreria socket.io (per il real-time) e express.

Frontend: Vite + React (veloce e leggero) + TailwindCSS (per la grafica).

AI: Google Gemini API.

Struttura Dati (Nel Server)
Non serve un database SQL. Basta un oggetto in memoria:

JavaScript

const rooms = {
  "XJ9K": {
    host: "socket_id_utente_1",
    guest: "socket_id_utente_2",
    topic: "Harry Potter",
    score: { host: 0, guest: 0 },
    status: "playing" // o "waiting"
  }
};
4. Tabella di Marcia (Sviluppo)
Passo 1: Il Backend (Fatto nel messaggio precedente)
Setup del server.

Creazione della logica socket.join(roomCode).

Integrazione con Gemini per ricevere JSON.

Passo 2: Il Frontend - Home Page
Due bottoni grandi: [CREA] e [ENTRA].

Se premi [CREA]: Invii evento create_room -> ricevi codice -> Mostri schermata attesa.

Se premi [ENTRA]: Mostri input text -> Invii evento join_room -> Aspetti conferma.

Passo 3: Il Frontend - Arena di Gioco
Questa schermata appare solo quando arriva l'evento game_start.

Deve mostrare:

Il punteggio (es. 2 - 1).

La domanda al centro.

4 bottoni colorati per le risposte.

Passo 4: Arbitraggio
Gestire il "chi arriva prima". Il server accetta solo la prima risposta valida per ogni domanda, blocca l'altra, assegna il punto e passa alla prossima.