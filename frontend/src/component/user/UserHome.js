import {React, useEffect, useState} from 'react';
import axios from 'axios';
//import AdminHeader from './AdminHeader';
import '../../styles/Common.css';
import UserHeader from './UserHeader';
import {  Link } from 'react-router-dom';
import Footer from '../../common/Footer';


function UserHome(){
    const[movies, setMovies] = useState([]);
    const[searchQuery, setSearchQuery] = useState('');
    
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
            console.log(response.data.movies);
            setMovies(response.data.movies);
        } catch(error){
            console.error('Error fetching movies:', error);
            //console.log(localStorage.getItem('accessToken'));
        }
    } ;

    const handleSearch = async() => {
        try{
            const filteredMovie = movies.filter((movie) => 
            movie.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        if(searchQuery.trim() === ""){
            fetchMovies();
        }else{
            setMovies(filteredMovie)

        }}catch (error) {
           
            console.error('Error fetching movies:', error.message);
          }
     }
    return(
        <main>
           <UserHeader/>
           <div className='search-bar'> 
            <input 
            type="text"
            placeholder='Search Movies'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            ></input>
            <button onClick={handleSearch}>Search</button>
        </div>
            <h2 className='headings'>Now Showing</h2>
            <div>
            <table className='table-border'>
                <thead >
                    <tr>
                        <th>Movie Name</th>
                        <th>Actors</th>
                        <th>Ticket Available</th>
                        <th>Movie Description</th>
                        <th>BOOK</th>
                    </tr>
                </thead>
                <tbody >
                {movies.map((movie) => (
                    <tr key={movie.title}>
                        <td>{movie.title}</td>
                        <td>{`${movie.actors[0]}, ${movie.actors[1]}`}</td>
                        <td>{movie.noOfTickets}</td>
                        <td>{movie.description}</td>
                        <td><Link className='button-book'
                        to= {`/bookingPage/${movie.title}/${movie.description}/${movie.noOfTickets}`}>
                        BOOK NOW</Link></td>
                        </tr>
                ))}
                </tbody>
            </table>
            </div>
            <Footer/>
        </main>
    );
};

export default UserHome;