import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './chart.css';
import './lesson.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="error-screen"><h1>Лаборатория временно недоступна</h1><p>Нервные сигналы идут по нервным путям, гормоны — с кровью к клеткам с подходящими рецепторами. Совместная работа этих механизмов поддерживает гомеостаз.</p><button onClick={() => window.location.reload()}>Перезагрузить лабораторию</button></main>;
    return this.props.children;
  }
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);
