import {React, useState, useEffect} from 'react';
import axios from 'axios';
import AdminHeader from './AdminHeader';
import { useParams } from 'react-router-dom';
import Footer from '../../common/Footer';

function BookedTickets(){
    const{movieId} = useParams()
    console.log(movieId)
    const[allTickets, setAllTickets] = useState([]);

    const fetchAllTickets = async() => {
        try{
            const response = await axios.post(`http://localhost:5000/booking/${movieId}`,{
                        headers:{
                            'Content-Type': 'application/json',
                            Authorization:`Bearer ${localStorage.getItem('accessToken')}`
                           }
                    });
            const data = (response.data);
            setAllTickets(data);
            console.log(data);
                     
        }catch(error){
            console.log("Error in fetching tickets",error)
        }
    }

    useEffect(() => {
        fetchAllTickets();
    }, []);

    return(
        <main>
            <AdminHeader/>
            <h3>All Booked Tickets</h3>
            <table className='table-border'>
                <thead>
                    <tr>
                        <th>User Id</th>
                        <th>Movie Id</th>
                        <th>Date of Booking</th>
                        <th>Number Of Tickets</th>
                        <th>Seat Numbers</th>
                    </tr>
                </thead>
                <tbody >
                {allTickets.length == 0 || allTickets == null ? 
                    <p>'No Tickets Available for this Movie'</p> :  (
                    allTickets.map((tickets) => (
                        <tr key={tickets._id}>
                            <td>{tickets.user}</td>
                            <td>{tickets.movie}</td>
                            <td>{tickets.date}</td>
                            {/* <td>{tickets.theatreName}</td> */}
                            <td>{tickets.tickets}</td>
                            <td>{tickets.seatNumber  }</td>
                        </tr>
                    )))
                }
                </tbody>
            </table>
            <Footer/>
        </main>
    )
}

export default BookedTickets;