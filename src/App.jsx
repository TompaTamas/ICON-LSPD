import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Guard from './components/Guard.jsx';
import Home from './pages/Home.jsx';
import Btk from './pages/Btk.jsx';
import Login from './pages/Login.jsx';
import Rules from './pages/Rules.jsx';
import Mdt from './pages/Mdt.jsx';
import Duty from './pages/Duty.jsx';
import Roster from './pages/Roster.jsx';
import Appointments from './pages/Appointments.jsx';
import Announcements from './pages/Announcements.jsx';
import Tickets from './pages/Tickets.jsx';
import Leave from './pages/Leave.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

const guarded = (level, element) => <Guard level={level}>{element}</Guard>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="btk" element={<Btk />} />
        <Route path="belepes" element={<Login />} />
        <Route path="szabalyzat" element={guarded('tag', <Rules />)} />
        <Route path="idopontok" element={guarded('tag', <Appointments />)} />
        <Route path="kozlemenyek" element={guarded('tag', <Announcements />)} />
        <Route path="ticketek" element={guarded('tag', <Tickets />)} />
        <Route path="profil" element={guarded('tag', <Profile />)} />
        <Route path="mdt" element={guarded('lspd', <Mdt />)} />
        <Route path="szolgalat" element={guarded('lspd', <Duty />)} />
        <Route path="allomany" element={guarded('lspd', <Roster />)} />
        <Route path="szabadsag" element={guarded('lspd', <Leave />)} />
        <Route path="admin" element={guarded('vezeto', <Admin />)} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
