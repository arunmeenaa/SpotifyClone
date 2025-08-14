import React, { useEffect, useRef } from "react";
import "./css/style.css";
import "./css/utility.css";

const Home = () => {
  const audioRef = useRef(null);
  const songsRef = useRef([]);
  const indexRef = useRef(0);

  useEffect(() => {
    const secondsToMMSS = (seconds) => {
      if (isNaN(seconds) || seconds < 0) return "00:00";
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const setPlayIcon = (isPlaying) => {
      const playBtn = document.getElementById("play");
      if (playBtn) playBtn.src = isPlaying ? "image/pause.svg" : "image/play.svg";
    };

    const highlightActive = () => {
      const ul = document.querySelector(".songlist ul");
      if (!ul) return;
      Array.from(ul.children).forEach((li, i) => {
        if (i === indexRef.current) li.classList.add("active-song");
        else li.classList.remove("active-song");
      });
    };

    const updateTimeAndProgress = () => {
      const audio = audioRef.current;
      const timeEl = document.querySelector(".songtime");
      const circleEl = document.querySelector(".circle");
      if (timeEl) {
        timeEl.innerHTML = `${secondsToMMSS(audio.currentTime)}/${secondsToMMSS(audio.duration)}`;
      }
      if (circleEl && audio.duration) {
        circleEl.style.left = (audio.currentTime / audio.duration) * 100 + "%";
      }
    };

    const setSongInfo = (track) => {
      const infoEl = document.querySelector(".songinfo");
      if (infoEl) infoEl.innerHTML = decodeURI(track);
      const timeEl = document.querySelector(".songtime");
      if (timeEl) timeEl.innerHTML = "00:00 / 00:00";
    };

    const playIndex = (idx, { autoplay = true } = {}) => {
      const audio = audioRef.current;
      const list = songsRef.current;
      if (!list.length) return;

      indexRef.current = (idx + list.length) % list.length;
      const track = list[indexRef.current];

      audio.pause();
      audio.currentTime = 0;

      audio.src = `/songs/${track}`;
      setSongInfo(track);
      highlightActive();

      if (autoplay) {
        audio.onloadedmetadata = async () => {
          try {
            await audio.play();
            setPlayIcon(true);
          } catch (err) {
            console.warn("Play interrupted:", err);
            setPlayIcon(false);
          }
        };
      } else {
        setPlayIcon(false);
      }
    };

    const renderSongList = () => {
      const ul = document.querySelector(".songlist ul");
      if (!ul) return;
      ul.innerHTML = "";
      for (const song of songsRef.current) {
        ul.innerHTML += `
          <li>
            <img class="invert" src="" alt="">
            <div class="info">
              <div>${song.replaceAll("%20", " ")}</div>
              <div></div>
            </div>
            <div class="playnow">
              <span>Play Now</span>
              <img class="invert" src="image/play.svg" alt="">
            </div>
          </li>`;
      }
      highlightActive();
    };

    audioRef.current = new Audio();
    const audio = audioRef.current;

    const onTime = () => updateTimeAndProgress();
    const onEnded = () => playIndex(indexRef.current + 1, { autoplay: true });
    const onPlay = () => setPlayIcon(true);
    const onPause = () => setPlayIcon(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    const playBtn = document.getElementById("play");
    const prevBtn = document.getElementById("previous");
    const nextBtn = document.getElementById("next");
    const seekbar = document.querySelector(".seekbar");
    const volInput = document.querySelector(".range input");
    const songList = document.querySelector(".songlist ul");

    const onPlayClick = () => {
      if (!audio.src) {
        playIndex(indexRef.current, { autoplay: true });
        return;
      }
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    };

    const onPrev = () => playIndex(indexRef.current - 1, { autoplay: true });
    const onNext = () => playIndex(indexRef.current + 1, { autoplay: true });

    const onSeek = (e) => {
      if (!seekbar || !audio.duration) return;
      const rect = seekbar.getBoundingClientRect();
      const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      audio.currentTime = pct * audio.duration;
      const circleEl = document.querySelector(".circle");
      if (circleEl) circleEl.style.left = `${pct * 100}%`;
    };

    const onVol = (e) => {
      audio.volume = Number(e.target.value) / 100;
    };

    const onSongListClick = (e) => {
      const ul = songList;
      if (!ul) return;
      const li = e.target.closest("li");
      if (!li || !ul.contains(li)) return;
      const idx = Array.from(ul.children).indexOf(li);
      if (idx >= 0) playIndex(idx, { autoplay: true });
    };

    playBtn?.addEventListener("click", onPlayClick);
    prevBtn?.addEventListener("click", onPrev);
    nextBtn?.addEventListener("click", onNext);
    seekbar?.addEventListener("click", onSeek);
    volInput?.addEventListener("change", onVol);
    songList?.addEventListener("click", onSongListClick);

    (async () => {
      try {
        const res = await fetch("/songs/songs.json", { cache: "no-cache" });
        const list = (await res.json()) ?? [];
        songsRef.current = Array.isArray(list) ? list : [];
      } catch {
        songsRef.current = [];
      }
      renderSongList();
      if (songsRef.current.length) {
        playIndex(0, { autoplay: false });
      }
    })();

    return () => {
      playBtn?.removeEventListener("click", onPlayClick);
      prevBtn?.removeEventListener("click", onPrev);
      nextBtn?.removeEventListener("click", onNext);
      seekbar?.removeEventListener("click", onSeek);
      volInput?.removeEventListener("change", onVol);
      songList?.removeEventListener("click", onSongListClick);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
    };
  }, []);

  return (
    <div className="container flex bg-black">
      {/* left section */}
      <div className="left">
        <div className="close">
          <img width="30" className="invert" src="image/close.svg" alt="" />
        </div>
        <div className="home bg-grey rounded m-1 p-1">
          <div className="logo">
            <img width="200px" className="invert" src="image/logo.svg" alt="logo" />
          </div>
          <ul>
            <li><img className="invert" src="image/home.svg" alt="home" />Home</li>
            <li><img className="invert" src="image/search.svg" alt="search" />Search</li>
          </ul>
        </div>
        <div style={{ width: "350px" }} className="library rounded bg-grey m-1 p-1">
          <div className="heading">
            <img className="invert" src="image/playlist.svg" alt="playlist" />
            <h2>Your Library</h2>
          </div>
          <div className="songlist">
            <ul></ul>
          </div>
          <div className="footer">
            <div><a href="#"><span>Legal</span></a></div>
            <div><a href="#"><span>Privacy Center</span></a></div>
            <div><a href="#"><span>Privacy Policy</span></a></div>
            <div><a href="#"><span>Cookies</span></a></div>
            <div><a href="#"><span>About Ads</span></a></div>
            <div><a href="#"><span>Accessibility</span></a></div>
          </div>
        </div>
      </div>

      {/* right section */}
      <div className="right bg-grey rounded">
        <div className="header">
          <div className="nav">
            <div className="humburgerCont">
              <img width="40px" className="invert humburger" src="image/humburger.svg" alt="" />
            </div>
          </div>
          <div className="button">
            <button className="signupbtn">Signup</button>
            <button className="loginbtn">Login</button>
          </div>
        </div>
        <div className="spotifyPlaylists">
          <h1>Spotify Playlists</h1>
          <div className="cardContainer">
            <div className="card">
              <div className="play">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <img src="https://i.scdn.co/image/ab67706f00000002dce5bc8321d570243742d421" alt="" />
              <h2>Pop Party!</h2>
              <p>Hits to boost your mood and fill your happiness</p>
            </div>
            <div className="card">
              <div className="play">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <img src="https://i.scdn.co/image/ab67706f00000002dce5bc8321d570243742d421" alt="" />
              <h2>Pop Party!</h2>
              <p>Hits to boost your mood and fill your happiness</p>
            </div>
          </div>
          <div className="playbar">
            <div className="seekbar">
              <div className="circle"></div>
            </div>
            <div className="abovebar">
              <div className="songinfo"></div>
              <div className="songbuttons">
                <img width="30" id="previous" src="image/previous.svg" alt="" />
                <img width="30" id="play" src="image/play.svg" alt="" />
                <img width="30" id="next" src="image/next.svg" alt="" />
              </div>
              <div className="timevol">
                <div className="songtime"></div>
                <div className="volume">
                  <img width="25" src="image/volume.svg" alt="" />
                  <div className="range">
                    <input type="range" name="volume" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
