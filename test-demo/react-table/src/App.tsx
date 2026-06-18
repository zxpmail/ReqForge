import Table from './components/Table';
import { users } from './data';
import './App.css';

function App() {
  return (
    <div className="app">
      <h1>Users</h1>
      <Table users={users} />
    </div>
  );
}

export default App;
