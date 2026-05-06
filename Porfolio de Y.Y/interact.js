const nav = document.querySelector('nav');
const navLinks = Array.from(document.querySelectorAll('nav a'));
const sections = Array.from(document.querySelectorAll('.section'));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.15 }
    );

    sections.forEach((section) => revealObserver.observe(section));
} else {
    sections.forEach((section) => section.classList.add('show'));
}

const topBtn = document.createElement('button');
topBtn.type = 'button';
topBtn.className = 'top-btn';
topBtn.textContent = '\u2191';
topBtn.setAttribute('aria-label', 'Retour en haut');
document.body.appendChild(topBtn);

const sectionById = new Map(sections.map((section) => [section.id, section]));
let ticking = false;

function getActiveSectionId() {
    const navHeight = nav ? nav.offsetHeight : 0;
    const probe = window.scrollY + navHeight + window.innerHeight * 0.28;

    let activeId = '';
    sections.forEach((section) => {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        if (probe >= top && probe < bottom) {
            activeId = section.id;
        }
    });

    return activeId;
}

function updateOnScroll() {
    const y = window.scrollY;

    if (nav) {
        nav.classList.toggle('sticky', y > 40);
    }

    topBtn.classList.toggle('show', y > 280);

    const activeId = getActiveSectionId();
    navLinks.forEach((link) => {
        const id = link.getAttribute('href')?.slice(1) || '';
        if (id && id === activeId) {
            link.setAttribute('aria-current', 'true');
        } else {
            link.removeAttribute('aria-current');
        }
    });

    ticking = false;
}

function queueUpdate() {
    if (!ticking) {
        window.requestAnimationFrame(updateOnScroll);
        ticking = true;
    }
}

window.addEventListener('scroll', queueUpdate, { passive: true });
window.addEventListener('resize', queueUpdate);
window.addEventListener('load', updateOnScroll);

navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('href')?.slice(1) || '';
        const target = sectionById.get(targetId);

        if (!target) {
            return;
        }

        event.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 0;
        const top = target.offsetTop - navHeight - 16;

        window.scrollTo({
            top,
            behavior: reduceMotion ? 'auto' : 'smooth'
        });
    });
});

topBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: reduceMotion ? 'auto' : 'smooth'
    });
});

updateOnScroll();

const projectCards = Array.from(document.querySelectorAll('#projects .card'));
const techCards = Array.from(document.querySelectorAll('#techwatch .timeline-content'));
const expandableCards = [...projectCards, ...techCards];
const projectModal = document.createElement('div');
projectModal.className = 'project-modal';
projectModal.setAttribute('aria-hidden', 'true');
projectModal.innerHTML = `
    <div class="project-modal__panel" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
        <button type="button" class="project-modal__close" aria-label="Fermer">&times;</button>
        <div class="project-modal__image" aria-hidden="true">
            <img src="" alt="Aperçu du projet">
        </div>
        <h3 id="project-modal-title" class="project-modal__title"></h3>
        <p class="project-modal__text"></p>
    </div>
`;
document.body.appendChild(projectModal);

const modalTitle = projectModal.querySelector('.project-modal__title');
const modalText = projectModal.querySelector('.project-modal__text');
const modalCloseBtn = projectModal.querySelector('.project-modal__close');
const modalPanel = projectModal.querySelector('.project-modal__panel');
const modalImageWrapper = projectModal.querySelector('.project-modal__image');
const modalImage = projectModal.querySelector('.project-modal__image img');
let currentCard = null;

function openProjectModal(card) {
    const title = card.querySelector('h3')?.textContent?.trim() || 'Projet';
    const text = card.querySelector('p')?.textContent?.trim() || '';
    const image = card.querySelector('.card-preview img');

    modalTitle.textContent = title;
    modalText.textContent = text;

    if (image?.src) {
        modalImage.src = image.src;
        modalImage.alt = image.alt || title;
        modalImageWrapper.classList.add('is-visible');
    } else {
        modalImageWrapper.classList.remove('is-visible');
        modalImage.src = '';
        modalImage.alt = '';
    }

    projectModal.classList.add('is-open');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    if (currentCard) {
        currentCard.setAttribute('aria-expanded', 'false');
    }

    currentCard = card;
    currentCard.setAttribute('aria-expanded', 'true');
    modalCloseBtn.focus();
}

function closeProjectModal() {
    projectModal.classList.remove('is-open');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    if (currentCard) {
        currentCard.setAttribute('aria-expanded', 'false');
        currentCard.focus();
    }

    currentCard = null;
}

expandableCards.forEach((card) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-expanded', 'false');

    card.addEventListener('click', () => openProjectModal(card));
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openProjectModal(card);
        }
    });
});

modalCloseBtn.addEventListener('click', closeProjectModal);

projectModal.addEventListener('click', (event) => {
    if (event.target === projectModal) {
        closeProjectModal();
    }
});

modalPanel.addEventListener('click', (event) => {
    event.stopPropagation();
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && projectModal.classList.contains('is-open')) {
        closeProjectModal();
    }
});

/* Gestion du défilement des projets */
const projectsGrid = document.querySelector('.projects-grid');
const scrollBtnLeft = document.querySelector('.scroll-btn--left');
const scrollBtnRight = document.querySelector('.scroll-btn--right');

if (projectsGrid && scrollBtnLeft && scrollBtnRight) {
    const scrollAmount = 360; // Distance de défilement en pixels

    function updateScrollButtons() {
        const isAtStart = projectsGrid.scrollLeft <= 0;
        const isAtEnd = projectsGrid.scrollLeft + projectsGrid.clientWidth >= projectsGrid.scrollWidth - 10;
        
        scrollBtnLeft.disabled = isAtStart;
        scrollBtnRight.disabled = isAtEnd;
    }

    scrollBtnLeft.addEventListener('click', () => {
        projectsGrid.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    scrollBtnRight.addEventListener('click', () => {
        projectsGrid.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    projectsGrid.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();
}
