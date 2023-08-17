
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dexie from 'dexie';
import { Card, Button, CircularProgress, Container, Typography, Box  } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const apiKey = 'https://randomuser.me/api/?results=50' //unknow error in connection using .env




const App = () => {
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  //create indexdb database with dexie 
  const db = new Dexie('MyDatabase');
  db.version(1).stores({ users: 'id,name,picture' });

  //Delete user from the indexdb databae
  const handleDeleteUser = async (userId) => {
    await db.users.delete(userId);
    setUserData(prevUserData => prevUserData.filter(user => user.id !== userId));
  };

  //Refresh the data in the indexdb database with a new complete set
  const handleRefresh = async (e) => {
    console.log('hello')
    e.preventDefault()
    try {
      await db.users.clear()
      setIsLoading(true);
      // Fetch data from the Random User API and save to indexeddb
      const response = await axios.get(apiKey)
      const fetchedUserData = response.data.results.map(user => ({
        id: user.login.uuid,
        name: `${user.name.title} ${user.name.first} ${user.name.last}`,
        picture: user.picture.large,
      }));
      //insert data into the database
      db.users.bulkPut(fetchedUserData);
      //set data to display in UI
      setUserData(fetchedUserData);
    }catch(error){
      console.error('Error fetching data:', error);
    }finally{
      setIsLoading(false);
    }
  }
  useEffect(() => {
    db.users.count().then(count => {
      if (count === 0) {
        // Fetch data from the Random User API and save to indexeddb
        axios.get(apiKey)
          .then(response => {
            const fetchedUserData = response.data.results.map(user => ({
              id: user.login.uuid,
              name: `${user.name.title} ${user.name.first} ${user.name.last}`,
              picture: user.picture.large,
            }));
            db.users.bulkPut(fetchedUserData);
            setUserData(fetchedUserData);
          })
          .catch(error => {
            console.error('Error fetching data:', error);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Data already exists in indexedb
        db.users.toArray().then(data => {
          setUserData(data);
          setIsLoading(false);
        });
      }
    })
  },[]);


  return <>
   <Container sx={{
        backgroundColor: '#ffffcc',
        padding: '20px',
        borderRadius: '8px'
      }}
    >

    <div>
      <Box display="flex" justifyContent="space-between"style={{ marginBottom: '10px' }}>
      <Button variant="contained" onClick={handleRefresh}>Refresh</Button>
      <Typography style={{ color: 'black' }} variant="h3" fontStyle="italic">Total items displayed: {userData.length}</Typography>
      </Box>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      {isLoading ? (
        <CircularProgress  /> // Show CircularProgress  while loading
      ) : (
        userData.map(user => (
          <Card key={user.id} style={{ flex: '0 0 calc(20% - 15px)', marginBottom: '10px'}}>
            <img src={user.picture} alt={user.name} />
            <p style={{ textAlign:'center' }}>{user.name}</p>
            <div style={{ display: 'flex', justifyContent: 'center'}}>
              <Button onClick={() => handleDeleteUser(user.id)}>{<DeleteIcon />}Delete</Button>
            </div>
          </Card>
        ))
      )}
      </div>
    </div>
    </Container>
  </>
};

export default App
