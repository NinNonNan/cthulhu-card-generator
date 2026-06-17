// Configurazione dei parametri della carta
const cardConfig = {
    // Dimensioni della tela (basate sulle tue immagini template)
    canvasWidth: 512,
    canvasHeight: 650,
    
    // Nomi dei file immagine template
    templateFiles: {
        guai: 'guaio_template.png',      // Assicurati che il nome file corrisponda a guai_template.png
        vantaggio: 'vantaggio_template.png' // Assicurati che il nome file corrisponda a vantaggio_template.png
        // (Nota: Per i file immagine forniti, ho usato 'guai_template.png' per image_19.png e 'vantaggio_template.png' per image_20.png)
    },
    
    // Posizioni e stili dei testi
    // (Regolate per centrare i testi negli spazi corretti dei template)
    header: {
        x: 256, // Centrato orizzontalmente (canvasWidth / 2)
        y: 38,  // Posizionato nella fascia nera superiore
        fontSize: 24,
        color: 'white' // Titolo bianco sulla fascia nera
    },
    title: {
        x: 256,
        y: 105, // Riportato alla posizione sotto la fascia nera
        fontSize: 32, // Leggermente più grande per il titolo
        fontFamily: 'Futura, "Century Gothic", sans-serif', // Imposta un font geometrico
        color: 'black' // Se il template ha già la fascia nera, usa bianco; se è un template bianco, usa nero
    },
    duration: { // NEW: Configurazione per la durata
        x: 256, // Centrato
        fontSize: 18,
        fontFamily: 'sans-serif', // Puoi personalizzare il font
        color: 'gray',
        prefix: 'Durata: '
    },
    consequence: { // NEW: Configurazione per il destino se non risolta
        x_min: 65,
        x_max: 447,
        fontSize: 16,
        fontFamily: 'sans-serif', // Puoi personalizzare il font
        color: 'darkred',
        prefix: 'Destino: '
    },
    body: {
        x_min: 65, // Margine sinistro (per evitare il bordo)
        x_max: 447, // Margine destro
        // y_start sarà calcolato dinamicamente
        fontSize: 20,
        color: 'black' // Corpo del testo nero
    }
};

// Funzione principale per generare la carta
async function generateCard(type, titleText, bodyText, durationText, consequenceText) {
    const canvas = document.createElement('canvas');
    canvas.width = cardConfig.canvasWidth;
    canvas.height = cardConfig.canvasHeight;
    const ctx = canvas.getContext('2d');
    
    // 1. Carica l'immagine template corretta
    const templateFileName = cardConfig.templateFiles[type];
    const templateImage = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Impossibile caricare il template: ${templateFileName}`));
        img.src = templateFileName;
    });
    
    // 2. Disegna l'immagine template sulla tela
    ctx.drawImage(templateImage, 0, 0, cardConfig.canvasWidth, cardConfig.canvasHeight);
    
    // 3. Disegna l'intestazione (VANTAGGIO o GUAIO)
    ctx.font = `bold ${cardConfig.header.fontSize}px sans-serif`;
    ctx.fillStyle = cardConfig.header.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const headerText = type === 'guai' ? 'GUAIO' : 'VANTAGGIO';
    ctx.fillText(headerText, cardConfig.header.x, cardConfig.header.y);
    
    // 4. Disegna il titolo della carta
    ctx.font = `bold ${cardConfig.title.fontSize}px ${cardConfig.title.fontFamily}`;
    ctx.fillStyle = cardConfig.title.color;
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, cardConfig.title.x, cardConfig.title.y);
    
    // Inizializza la posizione Y per il testo successivo, partendo da sotto il titolo
    let currentY = cardConfig.title.y + cardConfig.title.fontSize / 2 + 25; // Spazio dopo il titolo aumentato

    // 4a. Disegna la durata (se presente)
    if (durationText && durationText !== '') { // Controlla che non sia la stringa vuota della default option
        ctx.font = `${cardConfig.duration.fontSize}px ${cardConfig.duration.fontFamily}`;
        ctx.fillStyle = cardConfig.duration.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(cardConfig.duration.prefix + durationText, cardConfig.duration.x, currentY);
        currentY += cardConfig.duration.fontSize * 2.0; // Sposta Y per il prossimo elemento (più spazio)
    }

    // 4b. Disegna il destino se non risolta (se presente)
    if (consequenceText) {
        ctx.font = `${cardConfig.consequence.fontSize}px ${cardConfig.consequence.fontFamily}`;
        ctx.fillStyle = cardConfig.consequence.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Gestisce l'andata a capo per il testo del destino
        const wrappedConsequence = wrapText(
            ctx, 
            cardConfig.consequence.prefix + consequenceText, 
            cardConfig.consequence.x_max - cardConfig.consequence.x_min
        );
        for (const line of wrappedConsequence) {
            ctx.fillText(line, cardConfig.consequence.x_min, currentY);
            currentY += cardConfig.consequence.fontSize * 1.4; // Altezza riga per il destino aumentata
        }
        currentY += 20; // Padding dopo il testo del destino aumentato
    }
    
    // 5. Disegna il corpo del testo (con gestione dell'andata a capo), partendo da currentY
    ctx.font = `${cardConfig.body.fontSize}px 'Minion Pro', serif`;
    ctx.fillStyle = cardConfig.body.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const lines = wrapText(ctx, bodyText, cardConfig.body.x_max - cardConfig.body.x_min);
    let y = currentY; // Usa la posizione Y calcolata dinamicamente
    const lineHeight = cardConfig.body.fontSize * 1.4; // Interlinea aumentata per il corpo
    
    for (const line of lines) {
        ctx.fillText(line, cardConfig.body.x_min, y);
        y += lineHeight;
    }
    
    // Restituisce l'URL dei dati dell'immagine generata
    return canvas.toDataURL('image/png');
}

// Funzione helper per mandare a capo il testo
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

/**
 * Funzione helper per capitalizzare la prima lettera di ogni parola in una stringa.
 */
function capitalizeWords(str) {
    if (!str) return '';
    return str.split(' ').map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

/**
 * Funzione chiamata dal pulsante HTML per avviare la generazione
 */
async function preparaGenerazione() {
    const titolo = capitalizeWords(document.getElementById('titolo').value); // Applica la capitalizzazione
    const tipo = document.getElementById('tipo').value.toLowerCase(); // 'vantaggio' o 'guai'
    const testo = document.getElementById('testo').value;
    const durata = document.getElementById('durata').value; // Nuovo: valore della durata
    const destino = document.getElementById('destino').value; // Nuovo: valore del destino

    try {
        const cardDataUrl = await generateCard(tipo, titolo, testo, durata, destino); // Passa i nuovi argomenti
        const imgElement = document.getElementById('imgFinale');
        imgElement.src = cardDataUrl;
        imgElement.style.display = 'block'; // Rende visibile l'immagine
    } catch (error) {
        console.error("Errore durante la generazione:", error);
        alert("Impossibile generare la carta. Verifica che le immagini template siano nella cartella corretta.");
    }
}