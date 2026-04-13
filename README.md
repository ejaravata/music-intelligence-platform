# CIS 5500 Project

Welcome to Hotify! Here are list of instructions in order to connect to our server.

1. Clone the repository in command prompt
```
git clone https://github.com/yujeremy21/CIS5500-Project
```
- Once you are in the CIS5500-Project folder, you should be able to view all the folders using ls command and seeing the following output
```
$ ls
client/  data_cleaning/  README.md  server/
```

2. Install NPM on server and client using these commands (assuming Node.js is already installed on system) *Note-you only need to do this step once for each folder
```
cd server 
npm install 
cd ..
cd client 
npm install
cd ..
```

3. Open command prompt in vscode
- Use these commands to start the server
```
cd server
npm start
```

4. Open a NEW command prompt window
- Use these commands to start the client
```
cd client
npm run dev
```

5. To start the application, go to your browser and enter this into the search bar:
```
http://localhost:5173/
```

6. Login and explore Hotify. Enjoy our appliction!
