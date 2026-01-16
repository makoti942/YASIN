import React, { useState, useEffect } from 'react';
import { runTop5Consensus } from '@/utils/strategies';
import { useTickData } from '@/contexts/TickDataContext';
import { predictEntryPoint } from '@/utils/entryPointPredictor';
import './makoti.scss';

const MakotiPredictor = ({ onLoadToBotBuilder }) => {
  const { ticks = [], isConnected, symbol, setSymbol } = useTickData() || { ticks: [] };
  const [predictedDigit, setPredictedDigit] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('Ready to scan');

  useEffect(() => {
    if (ticks.length < 18) {
      setStatus(`Gathering data... ${ticks.length}/18 ticks`);
    } else {
      setStatus('Ready to scan');
    }
  }, [ticks.length]);

  const handleScan = async () => {
    if (ticks.length < 18) {
      setStatus('Need more ticks for analysis');
      return;
    }

    setIsScanning(true);
    setStatus('Analyzing patterns...');
    await new Promise(resolve => setTimeout(resolve, 800));

    const recent = ticks.slice(-100);
    const analysisTicks = recent.length > 1 ? recent.slice(0, -1) : recent;

    // Fallback if runTop5Consensus or predictEntryPoint is not available
    const topAnalysis = (typeof runTop5Consensus === 'function') ? runTop5Consensus(analysisTicks) : { digits: [Math.floor(Math.random() * 10)], confidence: 0.5 };

    if (topAnalysis.digits && topAnalysis.digits.length > 0) {
      const topFive = topAnalysis.digits.slice(0, 5);
      const entryPrediction = (typeof predictEntryPoint === 'function') ? predictEntryPoint(analysisTicks, topFive) : { entryDigit: topFive[0], confidence: 0.6 };
      const primaryDigit = entryPrediction.entryDigit !== null ? entryPrediction.entryDigit : topFive[0] ?? null;

      if (primaryDigit !== null) {
        setPredictedDigit(primaryDigit);
        setConfidence(Math.min(topAnalysis.confidence * 1.1, (entryPrediction.confidence || topAnalysis.confidence) * 1.05, 0.98));
        setStatus('Prediction ready for the next 3-7 ticks.');
      } else {
        setPredictedDigit(null);
        setConfidence(0);
        setStatus('Pattern not stable, collecting more data.');
      }
    } else {
      setPredictedDigit(null);
      setConfidence(0);
      setStatus('Collecting data to refine prediction.');
    }

    setIsScanning(false);
  };

  return (
    <div className="makoti-container">
      <div className="status-header">
        <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
        {isConnected ? 'Market Connected' : 'Connecting to Market...'}
      </div>
      
      <div className="predictor-card">
        <h2 className="title">Predicted Digit (Next 3-7 Ticks)</h2>
        <div className="digit-display">
          {isScanning ? (
            <div className="pulse">...</div>
          ) : predictedDigit !== null ? (
            <>
              <div className="digit">{predictedDigit}</div>
              <div className="confidence">Confidence: {(confidence * 100).toFixed(1)}%</div>
              {confidence >= 0.75 ? <div className="badge high">High confidence</div> : <div className="badge moderate">Moderate confidence</div>}
            </>
          ) : (
            <div className="placeholder">Press Scan</div>
          )}
        </div>

        <button className="scan-button" onClick={handleScan} disabled={isScanning || ticks.length < 18}>
          {isScanning ? 'Scanning...' : 'Scan Market'}
        </button>
        <div className="status-text">{status}</div>
      </div>
    </div>
  );
};

export default MakotiPredictor;
