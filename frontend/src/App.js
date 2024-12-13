import React from 'react';
import './App.css';
import LighthouseReport from './components/LighthouseReport';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Lighthouse Report Generator</h1>
            </header>
            <main>
                <LighthouseReport />
            </main>
        </div>
    );
}

export default App;
