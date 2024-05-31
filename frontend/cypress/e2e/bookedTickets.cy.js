 
// cypress/integration/bookedTickets.spec.js
describe('BookedTickets Component', () => {
    beforeEach(() => {
      cy.intercept('POST', 'http://localhost:5000/booking/*', (req) => {
        req.reply((res) => {
          res.send({
            statusCode: 200,
            body: [
              {
                _id: '66583525f7e755eda0ba086f',
                user: '66558e88e2381869d03bd46a',
                movie: '665820b360ded1de133b25ff',
                date: '2024-05-18T00:00:00.000Z',
                tickets: 2,
                seatNumber: [10],
             
              },
            ],
          });
        });
      }).as('fetchTickets');
    });
  
    it('fetches and displays tickets correctly', () => {
      cy.visit('http://localhost:3000/bookedTickets/:movieId'); // Update with your component's path
  
      // Ensure the API call is made and intercepted
      cy.wait('@fetchTickets').its('response.statusCode').should('eq', 200);
  
      // Check if the table renders with the correct data
      cy.get('table').should('be.visible');
      cy.get('tbody tr').should('have.length', 1);
      cy.get('tbody tr td').eq(0).should('have.text', '66558e88e2381869d03bd46a');
      cy.get('tbody tr td').eq(1).should('have.text', '665820b360ded1de133b25ff');
      cy.get('tbody tr td').eq(2).should('have.text', '2024-05-18T00:00:00.000Z');
      cy.get('tbody tr td').eq(3).should('have.text', '2');
      cy.get('tbody tr td').eq(4).should('have.text', '10');
      
    });
  
    it('displays a message when no tickets are available', () => {
      cy.intercept('POST', 'http://localhost:5000/booking/*', {
        statusCode: 200,
        body: [],
      }).as('fetchNoTickets');
  
      cy.visit('http://localhost:3000/bookedTickets/:movieId'); // Update with your component's path
  
      // Ensure the API call is made and intercepted
      cy.wait('@fetchNoTickets').its('response.statusCode').should('eq', 200);
  
      // Check if the message is displayed
      cy.contains('No Tickets Available for this Movie').should('be.visible');
    });
  
    it('handles API errors gracefully', () => {
      cy.intercept('POST', 'http://localhost:5000/booking/*', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      }).as('fetchError');
  
      cy.visit('http://localhost:3000/bookedTickets/:movieId'); // Update with your component's path
  
      // Ensure the API call is made and intercepted
      cy.wait('@fetchError').its('response.statusCode').should('eq', 500);
  
      // Check if the error is handled (you might want to show an error message in your component)
      // cy.contains('Error in fetching tickets').should('not.be.visible');
    });
  });
  