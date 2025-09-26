import React from 'react';

const SimpleRouter = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
      <h1>SimpleRouter Funcionando!</h1>
      <p>Teste com componente completamente novo.</p>
      <p>Data: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default SimpleRouter;
