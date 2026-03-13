/**
 * Dynamically loads projects from Supabase and renders them as tile grids.
 * Used by both index.html (featured only) and projects.html (all projects).
 */
(function () {
    'use strict';

    const tileClasses = [
        ['project-tile1', 'project-tile2'],
        ['project-tile2', 'project-tile1']
    ];

    function createTileHTML(project, tileClass, delay) {
        const detailLink = `project-detail.html?id=${project.id}`;
        return `
      <a href="${detailLink}" style="text-decoration:none;display:block;">
        <div class="${tileClass} reveal reveal-up delay-${delay}">
          <img src="${project.image}" alt="${project.title}">
          <div class="arrow-icon">
            <button class="about-button1">
              <span class="arrow arrow-diag arrow-out">➜</span>
              <span class="arrow arrow-diag arrow-in">➜</span>
            </button>
          </div>
          <div class="project-info-overlay">
            <h3>${project.title} ${project.isVerified ? '<i class="fas fa-check-circle" style="color: #22c55e; font-size: 0.8em; margin-left: 5px;"></i>' : ''}</h3>
            ${project.rating ? `<div class="project-rating-preview"><i class="fas fa-star" style="color: #fbbf24; font-size: 0.8em;"></i> ${project.rating}</div>` : ''}
            ${project.skills ? `<div class="project-skills-preview">${project.skills.slice(0, 3).join(' • ')}</div>` : ''}
          </div>
        </div>
      </a>
    `;
    }

    function renderProjectGrid(projects, containerId) {
        const container = document.getElementById(containerId);
        if (!container || projects.length === 0) return;

        let html = '';
        // Split into groups of 2 for left/right columns
        for (let i = 0; i < projects.length; i += 2) {
            const groupIndex = (i / 2) % 2;
            const direction = groupIndex % 2 === 0 ? 'left' : 'right';
            const classes = tileClasses[groupIndex];

            html += `<div class="projectgrp reveal reveal-${direction}">`;
            html += createTileHTML(projects[i], classes[0], 100);
            if (projects[i + 1]) {
                html += createTileHTML(projects[i + 1], classes[1], 200);
            }
            html += `</div>`;
        }

        container.innerHTML = html;

        // Re-bind cursor expand for the new tiles (desktop only)
        const cursorEnabled = !!(window.matchMedia && window.matchMedia('(pointer: fine) and (hover: hover) and (min-width: 1025px)').matches);
        const cursorDot = cursorEnabled ? document.querySelector('.circle') : null;
        if (cursorDot) {
            container.querySelectorAll('.project-tile1, .project-tile2').forEach(tile => {
                tile.addEventListener('mouseenter', () => cursorDot.classList.add('expand'));
                tile.addEventListener('mouseleave', () => cursorDot.classList.remove('expand'));
            });
        }
    }

    async function loadProjects() {
        try {
            const projects = await window.getProjectsData();

            const featured = projects.filter(p => p.featured);

            // Index page: hero grid + featured grid
            if (document.getElementById('hero-projects-grid')) {
                renderProjectGrid(featured, 'hero-projects-grid');
            }
            if (document.getElementById('featured-projects-grid')) {
                renderProjectGrid(featured, 'featured-projects-grid');
            }

            // Projects page: all projects grid
            if (document.getElementById('all-projects-grid')) {
                renderProjectGrid(projects, 'all-projects-grid');
            }

            // Re-initialize scroll reveal for the new dynamic elements
            if (window.initScrollReveal) {
                window.initScrollReveal();
            }
        } catch (err) {
            console.error('Failed to load projects:', err);
        }
    }

    // Load data
    loadProjects();
})();
