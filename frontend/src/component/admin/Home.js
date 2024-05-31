import {React, useEffect, useState} from 'react';
import axios from 'axios';
import AdminHeader from './AdminHeader';
import '../../styles/Common.css';
import {  Link } from 'react-router-dom';
import Footer from '../../common/Footer';


function Home(){
    const[movies, setMovies] = useState([]);

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async() => {
        try{
            const response = await axios.get('http://localhost:5000/movies', {
                validateStatus: function (status) {
                    return status >= 200 && status < 303; // default
                  },
                  
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer' + localStorage.getItem('accessToken')
                }
            });
            setMovies(response.data.movies);
            console.log(response.data.movies);
        } catch(error){
            setMovies('Error fetching movies');
            console.error('Error fetching movies:', error);
            //console.log(localStorage.getItem('accessToken'));
        }
    } ;
 
    const deleteMovie = (id) => {
        
        axios.delete(`http://localhost:5000/movies/${id}`,{
            // headers:{
            //     'Content-Type': 'application/json',
            //     Authorization:`Bearer ${localStorage.getItem('accessToken')}`
            // }
        })
        .then(response => {
            alert(response.data.message);
            console.log("Movie Deleted successfully");
            fetchMovies();
        })
        .catch(error => {
            console.error('Error deleting movie : ', error);
        });
    }
  

    
    
    return(
        <main>
            <AdminHeader/>
            <h2 className='headings'>All Shows</h2>
            <div>
            <table className='table-border'>
                <thead >
                    <tr>
                        <th>Movie ID</th>
                        <th>Movie Name</th>
                        <th>Description</th>
                        <th>Ticket Available</th>
                        {/* <th>Ticket Status</th> */}
                        <th>Ticket Details</th>
                        {/* <th>Update Ticket Status</th> */}
                        <th>Delete Movie</th>
                    </tr>
                </thead>
                <tbody >
                { movies.map((movie) => (
                    <tr key={movie._id}>
                        <td>{movie._id}</td>
                        <td>{movie.title}</td>
                        <td>{movie.description}</td>
                        <td>{movie.noOfTickets}</td>
                        {/* <td>{movie.ticketStatus}</td> */}
                        <td><Link className='button-book'
                        to= {`/bookedTickets/${movie._id}`}>
                        Details</Link></td>
                        
                        <td><button onClick={() => deleteMovie(movie._id)}
                         className='button-delete'> Delete </button></td>
                        </tr>
                ))}
                </tbody>
            </table>
            </div>
        <Footer/>
    </main>
        
    );
};

export default Home;