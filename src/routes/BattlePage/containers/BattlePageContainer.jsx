import React, { Component } from 'react'
import { connect } from 'react-redux'
import './BattlePageContainer.scss';
import Problem from '../components/Problem'
import CodeEditor from '../../CodeEditor/components/CodeEditor'
import ProgressBar from '../components/ProgressBar.js'
import axios from 'axios';
import Notifications, {notify} from 'react-notify-toast';
import { browserHistory } from 'react-router';
import ExampleModal from '../components/Modal';
import GameWonPage from '../../GameWonPage/components/GameWonPage';
import { setOpponentAnswers, setOwnAnswers } from '../../../store/matchresult';

class BattlePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //player object holds the socket id and the number of questions answered correctly
      player1: {

        id:'Player One',
        progress: 0,
        username: 'Player One',
        userID: '',
        powerUpNum: 0,
        code: []
      },
      player2: {
        id:'Player Two',
        progress: 0,
        username: 'Player Two',
        userID: '',
        powerUpNum: 0,
        code: []

      },
      //holds the question objects
      questionsArr: [],
      //the index of the questionArr
      currentQuestion: 0,
      timeElapsed: 0,
      startingTime: null,
      numberOfQuestions: 2,
      roomID: this.props.roomID.id,
      gameWon: false,
      modalIsOpen: false
    }
    this.sendAttack = this.sendAttack.bind(this);
  }

  sendAttack() {
    if (socket.id === this.state.player1.id && this.state.player1.powerUpNum > 0) {
      this.setState({
        player1: {
          id: this.state.player1.id,
          progress: this.state.player1.progress,
          username: this.state.player1.username,
          userID: this.state.player1.userID,
          powerUpNum: (this.state.player1.powerUpNum - 1),
          code: this.state.player1.code
        }
      });
      socket.emit('sending attack', this.props.roomID.id);
    }
    if (socket.id === this.state.player2.id && this.state.player2.powerUpNum > 0) {
      this.setState({
        player2: {
          id: this.state.player2.id,
          progress: this.state.player2.progress,
          username: this.state.player2.username,
          userID: this.state.player2.userID,
          powerUpNum: (this.state.player2.powerUpNum - 1),
          code: this.state.player2.code
        }
      });
      socket.emit('sending attack', this.props.roomID.id);
    }
  }

// send powerUpNum every time you set state

  componentDidMount() {
    //set the player ids to their socket ids
    //get the questions getting sent from the backend and store them in questionsArr
    const notifyTimer = 5000;
    const startingTime = Date.now();
    let p1username = 'Player One';
    let p2username = 'Player Two';
    socket.on('sending Questions', (data) => {
      // console.log('frontend data', data);
      p1username = data.player1.username;
      p2username = data.player2.username;
      this.setState({
        player1: {
          id:data.player1.socketId,
          progress: 0,
          username: p1username,
          userID: data.player1.id,
          powerUpNum: this.state.player1.powerUpNum,
          code: this.state.player1.code
        },
        player2: {
          id: data.player2.socketId,
          progress: 0,
          username: p2username,
          userID: data.player2.id,
          powerUpNum: this.state.player2.powerUpNum,
          code: this.state.player2.code
        },
        questionsArr: data.questions,

        startingTime: startingTime})
    })


    //when either player gets a question correct
    socket.on('updatePlayerScore', (data) => {
      // console.log("socket data",data);
      //string will hold the player who got the question correct
      let playerToUpdate = data.playerToUpdate;
      if (playerToUpdate === 'Player1'){
        // console.log("player 1 state", this.state.player1);
        //if the the clients socket ID matches the socket ID of player 1
        if (socket.id === data.currentPlayer){
          //change player 1's progress and their current question
          console.log(data.code);
          let newCode = this.state.player1.code;
          newCode.push(data.code);
          this.setState( {
            player1: {
              id: this.state.player1.id,
              progress: (this.state.player1.progress + 1),
              username: p1username,
              userID: this.state.player1.userID,
              powerUpNum: this.state.player1.powerUpNum,
              code: newCode
            },
            player2: {
              id: this.state.player2.id,
              progress: this.state.player2.progress,
              username: p2username,
              userID: this.state.player2.userID,
              powerUpNum: (this.state.player2.powerUpNum + 1),
              code: this.state.player2.code
            },
            currentQuestion: (this.state.currentQuestion + 1),
            roomID: data.roomID},
            () => {
            this.props.setOwnAnswers(this.state.player1.code);
            if (this.state.player1.progress === this.state.numberOfQuestions && this.state.gameWon === false){
                notify.show('You won the game!', 'success', notifyTimer);
                // console.log("inside player 1 win check")
                // console.log(this.state);
                socket.emit('gameOver', {
                  roomID: this.state.roomID,
                  winnerID: this.state.player1.id,
                  username: p1username,
                  winnerUserID: this.state.player1.userID,
                  loserUserID: this.state.player2.userID,
                  score: [this.state.player1.progress, this.state.player2.progress],
                  time: (Date.now() - this.state.startingTime)/1000
                });

                setTimeout(() => {
                      browserHistory.push('/gameWon');
                }, notifyTimer);
              }
            else if (this.state.player1.progress === this.state.numberOfQuestions && this.state.gameWon === true) {
                notify.show('You got all the answers! But your opponent was faster. :(', 'success', notifyTimer);
                setTimeout(() => {
                  browserHistory.push('/gameFinished');
                }, notifyTimer);
              }
              else {
                notify.show('You got an answer correct!', 'success', notifyTimer);
            }
          });

          // console.log('Player 1 progress updated and the question should have changed', this.state.player1.progress)
        }
        else {
          //change player 1's progress to update the score
          console.log(data.code);
          let newCode = this.state.player1.code;
          newCode.push(data.code);
          this.setState( {
            player1: {
              id: this.state.player1.id,
              progress: (this.state.player1.progress + 1),
              username: p1username,
              userID: this.state.player1.userID,
              powerUpNum: this.state.player1.powerUpNum,
              code: newCode
            },
            roomID: data.roomID,
            player2: {
              id: this.state.player2.id,
              progress: this.state.player2.progress,
              username: p2username,
              userID: this.state.player2.userID,
              powerUpNum: (this.state.player2.powerUpNum + 1),
              code: this.state.player2.code
            }
            }, () => {this.props.setOpponentAnswers(this.state.player1.code)})
          // console.log('Player 1 progress updated', this.state.player1.progress)

          if (this.state.player1.progress === this.state.numberOfQuestions){
            notify.show('Player 1 answered question #' + this.state.player1.progress + ' and won! You can still keep going, though :)', 'error', notifyTimer);
          } else {
            notify.show('Player 1 submitted a correct answer to question #' + this.state.player1.progress +'!', 'warning', notifyTimer);
          }
        }
      }
      //player must be player 2
      else {
        // console.log("player 2 state",this.state.player2);
        //if the client is player 2 update their progress and change the score
        if(socket.id === data.currentPlayer){
          console.log(data.code);
          let newCode = this.state.player2.code;
          newCode.push(data.code);
          this.setState( {
            player2: {
              id: this.state.player2.id,
              progress: (this.state.player2.progress + 1),
              username: p2username,
              userID: this.state.player2.userID,
              powerUpNum: this.state.player1.powerUpNum,
              code: newCode
            },
            player1: {
              id: this.state.player1.id,
              progress: this.state.player1.progress,
              username: p1username,
              userID: this.state.player1.userID,
              powerUpNum: (this.state.player1.powerUpNum + 1),
              code: this.state.player1.code
            },
              currentQuestion: (this.state.currentQuestion + 1),
              powerUpNum: this.state.player2.powerUpNum,
              roomID: data.roomID},
              () => {
              this.props.setOwnAnswers(this.state.player2.code);
              if (this.state.player2.progress === this.state.numberOfQuestions && this.state.gameWon === false){
                    notify.show('You won the game!', 'success', notifyTimer);
                    // console.log("inside player 2 win check")
                    // console.log(this.state);
                    socket.emit('gameOver', {
                      roomID: this.state.roomID,
                      winnerID: this.state.player1.id,
                      username: p1username,
                      winnerUserID: this.state.player2.userID,
                      loserUserID: this.state.player1.userID,
                      score: [this.state.player1.progress, this.state.player2.progress],
                      time: (Date.now() - this.state.startingTime)/1000});
                    setTimeout(() => {
                      browserHistory.push('/gameWon');
                    }, notifyTimer);
                }
              else if (this.state.player2.progress === this.state.numberOfQuestions && this.state.gameWon === true) {
                    notify.show('You got all the answers! But your opponent was faster. :(', 'success', notifyTimer);
                    setTimeout(() => {
                      browserHistory.push('/gameFinished');
                    }, notifyTimer);
                }
            else {
                    notify.show('You got an answer correct!', 'success', notifyTimer);
                }
          });

          // console.log('Player 2 progress updated and the question should have changed', this.state.player2.progress)
        }
        else {
          //just change player 2's score
          let newCode = this.state.player2.code;
          newCode.push(data.code);
          this.setState( {
            player2: {
              id: this.state.player2.id,
              progress: (this.state.player2.progress + 1),
              username: p2username,
              userID: this.state.player2.userID,
              powerUpNum: this.state.player2.powerUpNum,
              code: this.state.player2.code
            },
            roomID: data.roomID,
            player1: {
              id: this.state.player1.id,
              progress: this.state.player1.progress,
              username: p1username,
              userID: this.state.player1.userID,
              powerUpNum: (this.state.player1.powerUpNum + 1),
              code: this.state.player1.code
            }
            }, () => {this.props.setOpponentAnswers(this.state.player2.code)})
          // console.log('Player 2 progress updated', this.state.player2.progress )

          if (this.state.player2.progress === this.state.numberOfQuestions){
            notify.show('Player 2 answered question #' + this.state.player2.progress + ' and won! You can still keep going, though :)', 'error', notifyTimer);
          } else {
            notify.show('Player 2 submitted a correct answer to question #' + this.state.player2.progress +'!', 'warning', notifyTimer);
          }
        }
      }
      // console.log(`${data.playerToUpdate} has completed a question`);

    })

    //when a player fails an attempt
    socket.on('failedSub', (data) => {
      console.log(`${data.playerToUpdate} has failed an attempt because of ${data.reason}`);
    })


    socket.on('gameWinningState', (data) => {
      this.setState({gameWon: true});
    })

    socket.on('receive attack', (data) => {
      console.log('receiving attack');
      if (socket.id === data) {
        this.setState({
          modalIsOpen: true,
        });
        setTimeout(() => {
          this.setState({modalIsOpen: false});
        }, 9700);
      }
    })
  }

  render() {
    return (
      <div className="container" id="battlePageWrapper">
        <Notifications />
        <div className="row row-battlepage">
          <div className="col col-xs-12 col-md-6">
            <label id="playerProgressLabel">{`${this.state.player1.username}`}</label>
            <ProgressBar Progress={this.state.player1.progress} QuestionsArr={this.state.questionsArr} />
          </div>
          <div className="col col-xs-12 col-md-6">
            <label id="playerProgressLabel">{`${this.state.player2.username}`}</label>
            <ProgressBar Progress={this.state.player2.progress} QuestionsArr={this.state.questionsArr} />
          </div>
        </div>
        <div className="row row-battlepage">
          <div className="col col-xs-12 col-sm-6 col-md-4 col-lg-4" id="problemsContainers">
            <Problem CurrentQuestion={this.state.questionsArr[this.state.currentQuestion]}/>
           </div>
          <div className="col col-xs-12 col-sm-6 col-md-8 col-lg-8" id="codeeditor">
            <CodeEditor currentQuestionID={this.state.questionsArr[this.state.currentQuestion]} roomID={this.props.roomID.id}/>
          </div>
        </div>
        <ExampleModal modalIsOpen={this.state.modalIsOpen}/>
        <button className="btn btn-primary btn-small" id="submit-btn-attack" onClick={this.sendAttack}>Send Attack</button>
      </div>
    );
  }
}

const mapStateToProps = (state) => (
  { roomID : state.gameLobby,
    ownAnswers : state.matchResults.ownAnswers,
    opponentAnswers : state.matchResults.opponentAnswers
  }
)

const mapDispatchToProps = (dispatch) => ({
  setOpponentAnswers: function(answers) {
    console.log(answers);
    dispatch(setOpponentAnswers(answers));
  },
  setOwnAnswers: function(answers) {
    console.log(answers);
    dispatch(setOwnAnswers(answers));
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(BattlePage);
