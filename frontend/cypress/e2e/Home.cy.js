describe('Home Component', () => {
    const moviesData = {
      movies: [
        {
          "_id": "6656bd7ec9b0d7921bdadb24",
          "title": "Inception",
          "description": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.",
          "actors": [
            "Leonardo DiCaprio",
            "Joseph Gordon-Levitt",
            "Elliot Page"
          ],
          "releaseDate": "2010-07-16T00:00:00.000Z",
          "posterUrl": "https://example.com/posters/inception.jpg",
          "featured": true,
          "noOfTickets": 198,
          "bookedTickets": 2,
          "bookings": [
            "66585bfae7344b40ca743cbd"
          ],
          "admin": "6641b38cecc777022e156820",
          "__v": 1
        },
    
      ]
    };
  
    beforeEach(() => {
      cy.visit('http://localhost:3000/home'); // Assuming the Home page is the root route
      cy.intercept('GET', 'http://localhost:5000/movies', moviesData).as('getMovies');
      cy.wait('@getMovies');
    });
  
    // it('displays fetched movies', () => {
    //   cy.get('.table-border tbody tr').should('have.length', moviesData.movies.length);
    // });
  
    it('deletes a movie', () => {
      const updatedMoviesData = { ...moviesData };
      updatedMoviesData.movies.splice(0, 1); // Remove the first movie
      cy.intercept('DELETE', 'http://localhost:5000/movies/*', { statusCode: 200, body: { message: 'Movie deleted successfully' } }).as('deleteMovie');
  
      cy.get('.button-delete').first().click(); // Click on the delete button of the first movie
  
      cy.wait('@deleteMovie');
  
    //   cy.get('.table-border tbody tr').should('have.length', updatedMoviesData.movies.length);
    });
  
    it('handles error while fetching movies', () => {
      cy.intercept('GET', 'http://localhost:5000/movies', { statusCode: 500, body: 'Error fetching movies' }).as('getMovies');
  
      cy.wait('@getMovies');
   
    });
  });
  