import './App.css';
import React from 'react';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import FileUpload from './components/FileUpload';

function App() {
  return (
    <div className='d-flex items-center justify-center w-100 mt-30'>

      <FileUpload></FileUpload>
    </div>
  );
}

export default App;
