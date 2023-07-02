function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:audio/midi;base64,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }



function start() {
    function setup() {
        // Render the SVG
        document.getElementById("notation").innerHTML = tk.renderToSVG(1);
        
        // Get the MEI
        const meiContent = tk.getMEI();
        const parser = new DOMParser();
        mei = parser.parseFromString(meiContent, "text/xml");
        console.log(mei);
    }

    function readFile() {    
        for (const file of input.files) {
            const reader = new FileReader();
            const name = file.name.toLowerCase();
            if (name.endsWith(".musicxml") || name.endsWith(".xml") ||
                name.endsWith(".mei") || name.endsWith(".krn")) {
                reader.addEventListener("load", (e) => {
                    tk.loadData(e.target.result);
                    setup();
                });
                reader.readAsText(file);
            } else if (name.endsWith(".mxl")) {
                reader.addEventListener("load", (e) => {
                    tk.loadZipDataBuffer(e.target.result);
                    setup();
                });
                reader.readAsArrayBuffer(file);
            }
        }
    }

    const input = document.getElementById("input");
    input.addEventListener("change", readFile);

    const tk = new verovio.toolkit();
    console.log("Verovio has loaded!");

    const zoom = 80;
    const pageHeight = document.body.clientHeight * 100 / zoom; 
    const pageWidth = document.body.clientWidth * 100 / zoom;
    tk.setOptions({
        scale: zoom,
        svgAdditionalAttribute: ["note@pname", "note@oct"],
        pageWidth: pageWidth,
        //breaks: "none",
        mnumInterval: 1
    });

    console.log("Verovio options:", tk.getOptions());
    console.log("Verovio default options:", tk.getDefaultOptions());
    //fetch("https://www.verovio.org/examples/downloads/Schubert_Lindenbaum.mei")
    fetch("Schubert_Lindenbaum.mei")
    .then( (response) => response.text() )
    .then( (meiXML) => {
        // ... then we can load the data into Verovio ...
        tk.loadData(meiXML);
        // ... and generate the SVG for the first page ...
        let svg = tk.renderToSVG(1);
        // ... and finally gets the <div> element with the ID we specified,
        // and sets the content (innerHTML) to the SVG that we just generated.
        document.getElementById("notation").innerHTML = svg;
    });

    let currentPage = 1;

    const midiHightlightingHandler = function (event) {
        console.log(event);
        // Remove the attribute 'playing' of all notes previously playing
        let playingNotes = document.querySelectorAll('g.note.playing');
        for (let playingNote of playingNotes) playingNote.classList.remove("playing");
        // Get elements at a time in milliseconds (time from the player is in seconds)
        let currentElements = tk.getElementsAtTime(event.time * 1000);
        if (currentElements.page == 0) return;
        if (currentElements.page != currentPage) {
            currentPage = currentElements.page;
            document.getElementById("notation").innerHTML = tk.renderToSVG(currentPage);
        }
        // Get all notes playing and set the class
        for (note of currentElements.notes) {
            let noteElement = document.getElementById(note);
            if (noteElement) noteElement.classList.add("playing");
        }
    }

    MIDIjs.player_callback = midiHightlightingHandler;
    
    function saveMIDIHandler() {
        let base64midi = tk.renderToMIDI();
        download("output.mid",base64midi);
    }
    function playMIDIHandler() {
        let base64midi = tk.renderToMIDI();
        let midiString = 'data:audio/midi;base64,' + base64midi;
        MIDIjs.play(midiString);
    }

    function stopMIDIHandler() {
        MIDIjs.stop();
    }

    document.getElementById("saveMIDI").addEventListener("click", saveMIDIHandler);
    document.getElementById("playMIDI").addEventListener("click", playMIDIHandler);
    document.getElementById("stopMIDI").addEventListener("click", stopMIDIHandler);
}

const body = document.getElementsByTagName('body')[0];
const script = document.createElement('script');
script.src ="./verovio-toolkit-hum.js";
script.onload = () => {verovio.module.onRuntimeInitialized = start;}
body.appendChild(script);