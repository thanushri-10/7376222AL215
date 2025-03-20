import React, { useState } from "react";
import "./App.css";

function App() {
  const WINDOW_SIZE = 10;

  const [numberStore, setNumberStore] = useState({
    p: [], 
    f: [], 
    e: [], 
    r: [], 
  });

  const [selectedType, setSelectedType] = useState("p");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customId, setCustomId] = useState("");
  const [error, setError] = useState("");

  const dummyDataGenerators = {
    p: () =>
      [2, 3, 5, 7, 11, 13, 17, 19, 23, 29].slice(
        0,
        Math.floor(Math.random() * 5) + 3
      ),
    f: () =>
      [1, 1, 2, 3, 5, 8, 13, 21, 34, 55].slice(
        0,
        Math.floor(Math.random() * 5) + 3
      ),
    e: () =>
      [2, 4, 6, 8, 10, 12, 14, 16, 18, 20].slice(
        0,
        Math.floor(Math.random() * 5) + 3
      ),
    r: () =>
      Array.from({ length: Math.floor(Math.random() * 5) + 3 }, () =>
        Math.floor(Math.random() * 100)
      ),
  };

  const fetchDummyNumbers = (numberId) => {
    const qualifier = numberId.charAt(0);

    if (!["p", "f", "e", "r"].includes(qualifier)) {
      return Promise.reject(
        new Error("Invalid qualified ID. Must start with p, f, e, or r.")
      );
    }

    return new Promise((resolve, reject) => {
      const willSucceed = Math.random() < 0.9;

      setTimeout(() => {
        if (willSucceed) {
          resolve(dummyDataGenerators[qualifier]());
        } else {
          reject(new Error("Simulated network error"));
        }
      }, Math.random() * 600); 
    });
  };

  const fetchNumbers = async (numberId) => {
    setLoading(true);
    setError("");

    const qualifier = numberId.charAt(0);

    const windowPrevState = [...(numberStore[qualifier] || [])];

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Request timed out after 500ms")),
          500
        );
      });

      const newNumbers = await Promise.race([
        fetchDummyNumbers(numberId),
        timeoutPromise,
      ]);

      const updatedWindow = updateWindow(qualifier, newNumbers);

      const responseData = {
        windowPrevState,
        windowCurrState: updatedWindow,
        numbers: newNumbers,
        avg: calculateAverage(updatedWindow),
      };

      setResponse(responseData);
    } catch (err) {
      setError(err.message || "Failed to fetch numbers");

      setResponse({
        windowPrevState,
        windowCurrState: windowPrevState,
        numbers: [],
        avg: calculateAverage(windowPrevState),
      });
    } finally {
      setLoading(false);
    }
  };

  const updateWindow = (qualifier, newNumbers) => {
    let window = [...numberStore[qualifier]];

    for (const num of newNumbers) {
      if (!window.includes(num)) {
        if (window.length >= WINDOW_SIZE) {
          window.shift();
        }
        window.push(num);
      }
    }

    setNumberStore((prev) => ({
      ...prev,
      [qualifier]: window,
    }));

    return window;
  };

  const calculateAverage = (numbers) => {
    if (numbers.length === 0) return "0.00";
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return (sum / numbers.length).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = customId || selectedType;
    fetchNumbers(id);
  };

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
    setCustomId("");
  };

  const handleCustomIdChange = (e) => {
    setCustomId(e.target.value);
  };

  return (
    <div className="container">
      <h1>Average Calculator</h1>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label className="form-label">Select Number Type:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="p"
                checked={selectedType === "p" && !customId}
                onChange={handleTypeChange}
                className="radio-input"
              />
              Prime (p)
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="f"
                checked={selectedType === "f" && !customId}
                onChange={handleTypeChange}
                className="radio-input"
              />
              Fibonacci (f)
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="e"
                checked={selectedType === "e" && !customId}
                onChange={handleTypeChange}
                className="radio-input"
              />
              Even (e)
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="r"
                checked={selectedType === "r" && !customId}
                onChange={handleTypeChange}
                className="radio-input"
              />
              Random (r)
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Custom ID (optional):</label>
          <input
            type="text"
            value={customId}
            onChange={handleCustomIdChange}
            placeholder="e.g., p123, f456, e789, r000"
            className="text-input"
          />
          <p className="help-text">
            Must start with p, f, e, or r followed by any identifier
          </p>
        </div>

        <button type="submit" disabled={loading} className="button">
          {loading ? "Fetching..." : "Fetch Numbers"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {response && (
        <div className="results">
          <h2 className="results-title">Results</h2>

          <div className="result-item">
            <h3 className="result-label">Previous Window State:</h3>
            <div className="result-value">
              {response.windowPrevState.length > 0
                ? response.windowPrevState.join(", ")
                : "Empty"}
            </div>
          </div>

          <div className="result-item">
            <h3 className="result-label">Current Window State:</h3>
            <div className="result-value">
              {response.windowCurrState.length > 0
                ? response.windowCurrState.join(", ")
                : "Empty"}
            </div>
          </div>
          <div className="result-item">
            <h3 className="result-label">Numbers Received:</h3>
            <div className="result-value">
              {response.numbers && response.numbers.length > 0
                ? response.numbers.join(", ")
                : "No numbers received"}
            </div>
          </div>

          <div className="result-item">
            <h3 className="result-label">Average:</h3>
            <div className="result-value average">{response.avg}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
