import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, GripVertical, GripHorizontal, LayoutPanelLeft, LayoutPanelTop, Share } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../src/components/AlertDialog";
import { Alert, AlertDescription } from "../src/components/Alert";

// Custom Button Component with responsive padding
const Button = ({ children, className = '', ...props }) => (
  <button
    className={`px-2 py-1 md:px-4 md:py-2 rounded-md text-white flex items-center gap-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Language configurations remain the same
const languageConfigs = {
  py: {
    name: 'Python',
    defaultCode: 'print("Hello, World!")',
  },
  js: {
    name: 'NodeJS',
    defaultCode: 'console.log("Hello, World!");',
  },
  java: {
    name: 'Java',
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  },
  cpp: {
    name: 'C++',
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  },
  c: {
    name: 'C',
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  },
  go: {
    name: 'Go',
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
  },
  cs: {
    name: 'C#',
    defaultCode: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
  },
};

const MIN_PANEL_SIZE = 50;

const App = () => {
  // State declarations remain the same
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('py');
  const [code, setCode] = useState(languageConfigs.py.defaultCode);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [panelSize, setPanelSize] = useState(50);
  const [languageInfo, setLanguageInfo] = useState('');
  const [isHorizontalLayout, setIsHorizontalLayout] = useState(true);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [consoleId, setConsoleId] = useState('');
  const [tempConsoleId, setTempConsoleId] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const containerRef = useRef(null);
  const wsRef = useRef(null);

  // All the previous handlers and effects remain the same
  const connectToWebSocket = (id) => {
    const ws = new WebSocket(`ws://localhost:3001?id=${id}`);
    
    ws.onopen = () => {
      setConnected(true);
      setConnectionError('');
      wsRef.current = ws;
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'code_update') {
        setCode(data.code);
        setSelectedLanguage(data.language);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };

    ws.onerror = () => {
      setConnectionError('Failed to connect to sync server');
      setConnected(false);
      wsRef.current = null;
    };
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'code_update',
        code: newCode,
        language: selectedLanguage
      }));
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    setCode(languageConfigs[newLanguage].defaultCode);
    const langInfo = languages.find(lang => lang.language === newLanguage);
    if (langInfo) {
      setLanguageInfo(langInfo.info.split('\n')[0]);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'code_update',
        code: languageConfigs[newLanguage].defaultCode,
        language: newLanguage
      }));
    }
  };

  const handleConnectSubmit = () => {
    if (tempConsoleId.trim()) {
      setConsoleId(tempConsoleId.trim());
      connectToWebSocket(tempConsoleId.trim());
      setShowConnectDialog(false);
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('https://api.codex.jaagrav.in/list');
        const data = await response.json();
        setLanguages(data.supportedLanguages);
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };
    fetchLanguages();
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('code', code);
      formData.append('language', selectedLanguage);
      formData.append('input', '');

      const response = await fetch('https://api.codex.jaagrav.in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      }
      if (data.output) {
        setOutput(data.output);
      }
    } catch (error) {
      setError('Error executing code: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleLayout = () => {
    setIsHorizontalLayout(!isHorizontalLayout);
    setPanelSize(50);
  };

  // Resizing handlers remain the same
  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);

    if (e.type === 'touchstart') {
      const touch = e.touches[0];
      containerRef.current.initialPosition = {
        x: touch.clientX,
        y: touch.clientY,
        panelSize: panelSize
      };
    }
  }, [panelSize]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    if (containerRef.current) {
      containerRef.current.initialPosition = null;
    }
  }, []);

  const resize = useCallback((e) => {
    if (isResizing && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      let clientX, clientY;

      if (e.type === 'touchmove') {
        e.preventDefault();
        const touch = e.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      let newSize;
      
      if (e.type === 'touchmove' && containerRef.current.initialPosition) {
        const delta = isHorizontalLayout
          ? clientX - containerRef.current.initialPosition.x
          : clientY - containerRef.current.initialPosition.y;
        
        const deltaPercentage = (delta / (isHorizontalLayout ? container.width : container.height)) * 100;
        newSize = containerRef.current.initialPosition.panelSize + deltaPercentage;
      } else {
        newSize = isHorizontalLayout
          ? ((clientX - container.left) / container.width) * 100
          : ((clientY - container.top) / container.height) * 100;
      }

      newSize = Math.max(
        (MIN_PANEL_SIZE / (isHorizontalLayout ? container.width : container.height)) * 100,
        Math.min(
          newSize,
          100 - ((MIN_PANEL_SIZE / (isHorizontalLayout ? container.width : container.height)) * 100)
        )
      );

      setPanelSize(newSize);
    }
  }, [isResizing, isHorizontalLayout]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      window.addEventListener('touchmove', resize, { passive: false });
      window.addEventListener('touchend', stopResizing);
      window.addEventListener('touchcancel', stopResizing);

      return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
        window.removeEventListener('touchmove', resize);
        window.removeEventListener('touchend', stopResizing);
        window.removeEventListener('touchcancel', stopResizing);
      };
    }
  }, [isResizing, resize, stopResizing]);

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      {/* Responsive Header */}
      <div className="bg-gray-800 text-gray-100">
        {/* Main toolbar - always visible */}
        <div className="flex flex-wrap items-center gap-2 p-2 md:p-4">
          <div className="text-xl font-bold mr-auto">Code Playground</div>
          
          {/* Language selector - Moves to second row on small screens */}
          <div className="order-1 md:order-none w-full md:w-auto">
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="w-full md:w-auto bg-gray-700 text-white px-2 py-1 md:px-3 md:py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Object.entries(languageConfigs).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 ml-auto md:ml-0">
            <Button
              onClick={() => setShowConnectDialog(true)}
              className="bg-gray-700 hover:bg-gray-600"
              title="Connect to sync session"
            >
              <Share className="w-4 h-4" />
              <span className="hidden md:inline">Share</span>
            </Button>
            
            <Button
              onClick={toggleLayout}
              className="bg-gray-700 hover:bg-gray-600"
              title={isHorizontalLayout ? "Switch to vertical layout" : "Switch to horizontal layout"}
            >
              {isHorizontalLayout ? (
                <LayoutPanelTop className="w-4 h-4" />
              ) : (
                <LayoutPanelLeft className="w-4 h-4" />
              )}
              <span className="hidden md:inline">Layout</span>
            </Button>
            
            <Button 
              onClick={handleRun}
              className={`${isRunning ? 'bg-gray-500' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              disabled={isRunning}
            >
              <Play className="w-4 h-4" />
              <span className="hidden md:inline">{isRunning ? 'Running...' : 'Run'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Connection error alert */}
      {connectionError && (
        <Alert variant="destructive" className="m-2 md:m-4">
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}

      {/* Main content area */}
      <div 
        ref={containerRef} 
        className={`flex flex-1 overflow-hidden ${isHorizontalLayout ? 'flex-row' : 'flex-col'}`}
      >
        <div 
          className="overflow-hidden" 
          style={{ 
            [isHorizontalLayout ? 'width' : 'height']: `${panelSize}%`,
          }}
        >
          <textarea
            value={code}
            onChange={handleCodeChange}
            className="w-full h-full bg-gray-900 text-gray-100 p-4 font-mono resize-none focus:outline-none"
            spellCheck="false"
            placeholder={`Enter your ${languageConfigs[selectedLanguage].name} code here...`}
          />
        </div>

        <div
          className={`flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors ${
            isHorizontalLayout 
              ? 'w-4 h-full cursor-col-resize' 
              : 'w-full h-4 cursor-row-resize'
          }`}
          onMouseDown={startResizing}
          onTouchStart={startResizing}
          role="separator"
          aria-orientation={isHorizontalLayout ? 'vertical' : 'horizontal'}
        >
          {isHorizontalLayout ? (
            <GripVertical className="w-4 h-4 text-gray-500" />
          ) : (
            <GripHorizontal className="w-4 h-4 text-gray-500" />
          )}
        </div>

        <div 
          className="overflow-hidden" 
          style={{ 
            [isHorizontalLayout ? 'width' : 'height']: `${100 - panelSize}%`,
          }}
        >
          <div className="bg-black text-white p-4 font-mono h-full overflow-auto">
            {error && (
              <div className="text-red-400 mb-2 whitespace-pre-wrap">{error}</div>
            )}
            {output && (
              <div className="text-green-400 whitespace-pre-wrap">{output}</div>
            )}
          </div>
        </div>

        {isResizing && (
          <div className={`fixed inset-0 ${
            isHorizontalLayout ? 'cursor-col-resize' : 'cursor-row-resize'
          } select-none`} />
        )}
      </div>

      {/* Responsive status bar */}
      <div className="bg-gray-700 text-gray-300 text-xs md:text-sm">
        <div className="flex flex-col md:flex-row md:items-center px-2 py-1 md:px-4 md:py-2 gap-1 md:gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Language:</span>
            <span>{languageInfo || languageConfigs[selectedLanguage].name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <span>{isRunning ? 'Executing...' : 'Ready'}</span>
          </div>
          
          <div className="flex items-center gap-2 md:ml-auto">
            <span>
              {connected ? (
                <span className="text-green-400">Connected to: {consoleId}</span>
              ) : (
                <span className="text-gray-400">Not connected</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Connect Dialog */}
      <AlertDialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Connect to Sync Session</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a console ID to sync code with another instance. Share this ID with others to collaborate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <input
              type="text"
              value={tempConsoleId}
              onChange={(e) => setTempConsoleId(e.target.value)}
              placeholder="Enter console ID..."
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="mt-2 sm:mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConnectSubmit}>Connect</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default App;