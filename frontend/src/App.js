import { Route, BrowserRouter, Routes } from "react-router-dom";
import Registration from "./component/registration/Registration";
import Login from "./component/login/Login"
import Home from "./component/admin/Home";
import UserHome from "./component/user/UserHome";
import BookingPage from "./component/user/BookingPage";
import BookedTickets from "./component/admin/BookedTickets";
import ResetPassword from "./component/login/ResetPassword";
 
function App() {
  return (
   <div>
    <BrowserRouter>
    <Routes>
        <Route path="/" element={ <Registration/>}></Route>
        <Route path="/login" element={ <Login/>}></Route>
        <Route path="/home" element={<Home/>}></Route>
        <Route path="/userHome" element={<UserHome/>}></Route>
        <Route path="/bookingPage/:movieName/:theatreName/:noOfTicketsAvailable" element={<BookingPage/>} ></Route>
        <Route path="/bookedTickets/:movieId" element={<BookedTickets/>}></Route>
        <Route path="/resetPassword" element={<ResetPassword/>}></Route>
      </Routes>
    </BrowserRouter>
   </div>

  );
}

export default App;
