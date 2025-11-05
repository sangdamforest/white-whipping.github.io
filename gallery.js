
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_KEY);

const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const uploadBox = document.getElementById('upload-box');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const gallery = document.getElementById('gallery');

let currentUser = null;

async function updateUser() {
  const { data } = await supabase.auth.getUser();
  currentUser = data.user;
  if (currentUser) { uploadBox.style.display='block'; logoutBtn.style.display='inline-block'; }
  else { uploadBox.style.display='none'; logoutBtn.style.display='none'; }
}

signupBtn.onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  await supabase.auth.signUp({ email, password });
};

loginBtn.onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  await supabase.auth.signInWithPassword({ email, password });
  updateUser();
};

logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  updateUser();
};

uploadBtn.onclick = async () => {
  if (!currentUser) return alert("로그인 필요");
  const file = fileInput.files[0];
  if (!file) return;
  const filename = `${Date.now()}-${file.name}`;
  const nick = currentUser.email.split("@")[0];
  await supabase.storage.from('fanart').upload(filename, file);
  await supabase.from('fanart_meta').insert({ filename, user: nick });
  refreshGallery();
};

async function refreshGallery() {
  const { data: files } = await supabase.from('fanart_meta').select('*').order('created_at', { ascending:false });
  gallery.innerHTML = '';
  files?.forEach(async (item) => {
    const div = document.createElement('div');
    div.className='item';

    const img = document.createElement('img');
    img.src = `${window.SUPABASE_URL}/storage/v1/object/public/fanart/${item.filename}`;
    div.appendChild(img);

    // like
    const likeBtn = document.createElement('button');
    likeBtn.className='like-btn';
    likeBtn.innerHTML = `❤️ ${item.likes ?? 0}`;
    likeBtn.onclick = async () => {
      await supabase.rpc('increment_like', { f_filename:item.filename });
      refreshGallery();
    };
    div.appendChild(likeBtn);

    // comments
    const { data: comments } = await supabase.from('fanart_comments').select('*').eq('filename', item.filename).order('created_at');
    const commentSection = document.createElement('div');
    commentSection.className='comment-box';
    comments?.forEach(c => {
      const p=document.createElement('p');
      p.textContent=`${c.user}: ${c.content}`;
      commentSection.appendChild(p);
    });
    div.appendChild(commentSection);

    // comment form
    if (currentUser) {
      const form=document.createElement('div');
      form.className='comment-form';
      const input=document.createElement('input');
      input.placeholder='댓글 입력';
      const btn=document.createElement('button');
      btn.textContent='등록';
      btn.onclick=async ()=>{
        const nick=currentUser.email.split("@")[0];
        await supabase.from('fanart_comments').insert({ filename:item.filename, user:nick, content:input.value });
        refreshGallery();
      };
      form.appendChild(input); form.appendChild(btn);
      div.appendChild(form);
    }

    gallery.appendChild(div);
  });
}

updateUser();
refreshGallery();

gallery.addEventListener("click", (e) => {
  if (e.target.tagName === "IMG") {
    document.getElementById("lightbox-img").src = e.target.src;
    document.getElementById("lightbox").style.display = "flex";
  }
});
document.getElementById("lightbox").addEventListener("click", () => {
  document.getElementById("lightbox").style.display = "none";
});
