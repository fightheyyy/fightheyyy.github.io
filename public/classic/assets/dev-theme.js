(() => {
  const root = document.documentElement;
  let theme = 'dev';
  try { theme = localStorage.getItem('blog-style') || 'dev'; } catch {}
  root.dataset.blogStyle = theme === 'classic' ? 'classic' : 'dev';
  document.addEventListener('DOMContentLoaded', () => {
    const home = document.body.classList.contains('home-page');
    const base = home ? '' : '../';
    const header = document.createElement('header');
    header.className = 'dev-header';
    header.innerHTML = `<a class="dev-pet" href="${base}index.html" aria-label="金渐层小猫，返回首页"><svg viewBox="0 0 68 48" width="102" height="68" aria-hidden="true" shape-rendering="crispEdges"><defs><linearGradient id="cat-gold" x2="0.8" y2="1"><stop stop-color="#f6d98b"/><stop offset=".5" stop-color="#d9a54d"/><stop offset="1" stop-color="#a56b30"/></linearGradient></defs><g class="cat-body"><path fill="url(#cat-gold)" d="M12 9h6v4h6V9h6v5h6v4h8v4h6v15h-5v6h-6v-6H24v6h-6V30h-6z"/><path fill="#f4d89b" d="M15 13h3v5h-3zm12 0h3v5h-3zM18 27h12v6H18z"/><path fill="#97632e" d="M21 17h3v5h-3zm9 14h3v6h-3zm7 0h3v6h-3z"/><g class="cat-eyes" fill="#28251d"><path d="M15 23h3v3h-3zm12 0h3v3h-3z"/></g><path fill="#a96846" d="M21 28h3v2h-3z"/><path class="cat-tail" fill="url(#cat-gold)" d="M47 30h7V18h-4v-5h8v5h2v16h-4v3h-9z"/></g></svg></a><nav aria-label="主导航"><a href="${base}index.html">[H] HOME</a><a href="${base}index.html#blog">[W] WRITING</a><a href="${base}index.html#projects">[P] PROJECTS</a><a href="https://github.com/fightheyyy" target="_blank" rel="noreferrer">[G] GITHUB ↗</a></nav>`;
    const toggle = document.createElement('button');
    toggle.className = 'style-toggle';
    const updateToggle = () => {
      toggle.textContent = root.dataset.blogStyle === 'dev' ? '风格：Dev / 切换' : '风格：原版 / 切换';
      toggle.setAttribute('aria-label', root.dataset.blogStyle === 'dev' ? '切换到原版风格' : '切换到 Dev 风格');
    };
    updateToggle();
    toggle.addEventListener('click', () => {
      root.dataset.blogStyle = root.dataset.blogStyle === 'dev' ? 'classic' : 'dev';
      try { localStorage.setItem('blog-style', root.dataset.blogStyle); } catch {}
      updateToggle();
      filter();
    });
    header.append(toggle);
    document.body.prepend(header);
    if (!home) return;
    const writing = document.querySelector('.writing-index-section');
    const projects = document.querySelector('#projects');
    const toolbar = document.createElement('div');
    toolbar.className = 'dev-toolbar';
    toolbar.innerHTML = '<div class="dev-tabs" role="group" aria-label="内容栏目"><button type="button" data-section="writing" aria-pressed="true">ALL WRITING</button><button type="button" data-section="projects" aria-pressed="false">PROJECTS</button></div><label class="dev-search"><span>[S]</span><input type="search" aria-label="搜索文章和项目" placeholder="SEARCH" /></label>';
    writing.before(toolbar);
    const empty = document.createElement('p'); empty.className = 'dev-empty';
    empty.textContent = '没有匹配的内容，试试其他关键词。'; empty.setAttribute('role', 'status'); toolbar.after(empty);
    let section = location.hash === '#projects' ? 'projects' : 'writing';
    const input = toolbar.querySelector('input');
    function filterHome() {
      const active = root.dataset.blogStyle === 'dev'; let count = 0;
      for (const [name, element] of [['writing', writing], ['projects', projects]]) {
        element.hidden = active && section !== name;
        element.querySelectorAll('.index-item').forEach(item => {
          item.hidden = active && !item.textContent.toLowerCase().includes(input.value.trim().toLowerCase());
          if (section === name && !item.hidden) count++;
        });
      }
      empty.hidden = !active || count > 0;
      toolbar.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.section === section)));
    }
    filter = filterHome;
    toolbar.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { section = button.dataset.section; filter(); }));
    input.addEventListener('input', filterHome);
    header.querySelectorAll('a[href*="#"]').forEach(link => link.addEventListener('click', () => { section = link.hash === '#projects' ? 'projects' : 'writing'; filter(); }));
    window.addEventListener('hashchange', () => { section = location.hash === '#projects' ? 'projects' : 'writing'; filter(); });
    document.addEventListener('keydown', event => {
      if (root.dataset.blogStyle !== 'dev' || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
      if (event.key.toLowerCase() === 's') { event.preventDefault(); input.focus(); }
    });
    filter();
  });
  let filter = () => {};
})();