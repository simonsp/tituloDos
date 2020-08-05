import React, { useState } from "react";
import logo from "./logo.svg";
import rxJS from "./rxjs-logo.png";
import utem from "./utem-logo.png";
import spotify from "./spotify-logo.png";
import { BehaviorSubject, from } from "rxjs";
import {
  filter,
  debounceTime,
  distinctUntilChanged,
  mergeMap,
} from "rxjs/operators";
import "./App.css";
import { useObservable } from "../hooks";

const spotifyCredentials = {
  token:
    "BQADbErm8X8CtWDR7p-Rrz6MdyvUK_lVgz8LzgrmO5ITuX8Jnsw0gaQjIqrvdQboZmrJoNjFg7Sg3hSIqgzdEUoYnGgcpA80OWxjJg-sGiJ-z78QXem55ey6Jh0R3l1CgPfofgotuCcMxl0heRkyEn16qhp9e4Tx4OszUimC363RZROK8hvvg5dh7aQXjTDhGm-VQc96mRK2pmq1YdpaD2MOF7vfwheERNyT1XftQi_-LAzHLpqPu6LisTlaDwFgi3LRGJI8mYQn8JFqJQ",
};

const searchArtists = async (search) => {
  try {
    const data = await fetch(
      `https://api.spotify.com/v1/search?q=${search}&type=artist`,
      {
        headers: { Authorization: `Bearer ${spotifyCredentials.token}` },
      }
    );
    const { artists } = await data.json();
    return artists;
  } catch (error) {
    console.log(error);
  }
};

let searchSubject = new BehaviorSubject("");

let searchResultsObservable = searchSubject.pipe(
  filter((val) => val.length > 1),
  debounceTime(750),
  distinctUntilChanged(),
  mergeMap((val) => from(searchArtists(val)))
);

function App() {
  const [search, setSearch] = useState(``);
  const [artists, setArtists] = useState([]);

  const handleSearch = (e) => {
    const newValue = e.target.value;
    setSearch(newValue);
    searchSubject.next(newValue);
  };

  useObservable(searchResultsObservable, setArtists);

  return (
    <div className="App">
      <header className="App-logos">
        <img src={logo} className="App-logo" alt="react-logo" />
        <img src={utem} className="App-logo" alt="utem-logo" />
        <img src={rxJS} className="App-logo" alt="rxjs-logo" />
      </header>
      <div className="App-title">
        <p className="parag">Trabajo de título II - RxJS + React Example</p>
        <a
          className="App-link"
          href="https://github.com/SimonSP/tituloDos"
          target="_blank"
          rel="noopener noreferrer"
        >
          Repositorio
        </a>
        <h3>Buscar artista en Spotify: </h3>
        <input
          placeholder="Escriba el nombre de un artista..."
          type="text"
          value={search}
          onChange={handleSearch}
        ></input>
      </div>
      <div className="App-results">
        {artists &&
          artists.items &&
          artists.items.map((artist) => {
            console.log(artist);
            return (
              <div className="App-card">
                <h2>{artist.name}</h2>
                <div className="App-card-body">
                  <img
                    alt="artist"
                    className="App-card-img"
                    src={
                      artist.images.length > 0 ? artist.images[1].url : spotify
                    }
                  ></img>
                  <p className="parag">Seguidores: {artist.followers.total.toLocaleString()}</p>
                  <p className="parag">Popularidad: {artist.popularity}</p>
                  <p className="parag">
                    Géneros musicales:{" "}
                    {artist.genres.length > 0
                      ? artist.genres[1]
                      : `Sin género específico`}
                  </p>
                  <a
                    href={artist.external_urls.spotify}
                    class="fa fa-spotify"
                    target="_blank"
                    rel="noopener noreferrer"> </a>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default App;
