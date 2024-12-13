import React, { useState } from 'react';
import axios from 'axios';
import './LighthouseReport.css'
const App = () => {
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const url = event.target.url.value;

    if (!url.trim()) {
      setError('Please enter a valid URL.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/generate-report', { url });
      const fileName = response.data.reportFile;

      const reportResponse = await axios.get(`http://localhost:5000/get-report/${fileName}`);
      setReportData(reportResponse.data);
    } catch (err) {
      setError('Failed to generate or fetch the report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const Table = ({ title, headers, data }) => (
    <div className="table-section">
      <h2 className="table-title">{title}</h2>
      <table className="styled-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="app-container">
      <h1 className="app-title">Lighthouse Report Viewer</h1>

      <form onSubmit={handleSubmit} className="url-form">
        <input type="text" name="url" placeholder="Enter URL" className="url-input" />
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Report'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {reportData && (
        <>
          <Table
            title="Overall Score"
            headers={['Category', 'Score', 'Description']}
            data={Object.values(reportData.categoryScores).map((value) => [
              value.title,
              value.score,
              value.description,
            ])}
          />
          <Table
            title="Key Metrics"
            headers={['Metric', 'Score', 'Display Value', 'Description']}
            data={Object.values(reportData.keyMetrics).map((value) => [
              value.title,
              value.score,
              value.displayValue,
              value.description,
            ])}
          />
          <Table
            title="Suggestions"
            headers={['Audit Title', 'Description', 'Display Value']}
            data={Object.values(reportData.auditSuggestions).map((value) => [
              value.title,
              value.description,
              value.displayValue,
            ])}
          />
        </>
      )}
    </div>
  );
};

export default App;
