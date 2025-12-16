(function() {
  'use strict';

  if (window.__app && window.__app.initialized) {
    return;
  }

  window.__app = window.__app || {};
  const app = window.__app;

  const debounce = function(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  };

  const throttle = function(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
        }, limit);
      }
    };
  };

  const prefersReducedMotion = function() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  const escapeHtml = function(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  };

  app.initBurger = function() {
    if (app.burgerInitialized) return;
    app.burgerInitialized = true;

    const nav = document.querySelector('.c-nav#main-nav');
    const toggle = document.querySelector('.c-nav__toggle');
    const navList = document.querySelector('.c-nav__list');
    const body = document.body;

    if (!nav || !toggle || !navList) return;

    let isOpen = false;

    const openMenu = function() {
      isOpen = true;
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
    };

    const closeMenu = function() {
      isOpen = false;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
    };

    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', function(e) {
      if (isOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    const navLinks = document.querySelectorAll('.c-nav__link');
    for (let i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        if (isOpen) {
          closeMenu();
        }
      });
    }

    const resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024 && isOpen) {
        closeMenu();
      }
    }, 200);

    window.addEventListener('resize', resizeHandler);
  };

  app.initAnchors = function() {
    if (app.anchorsInitialized) return;
    app.anchorsInitialized = true;

    const isHomepage = location.pathname === '/' || location.pathname === '/index.html' || location.pathname.endsWith('/');

    if (!isHomepage) {
      const sectionLinks = document.querySelectorAll('a[href^="#"]');
      for (let i = 0; i < sectionLinks.length; i++) {
        const link = sectionLinks[i];
        const href = link.getAttribute('href');
        if (href && href !== '#' && href !== '#!' && !href.startsWith('#!') && href.length > 1) {
          link.setAttribute('href', '/' + href);
        }
      }
    }

    const anchors = document.querySelectorAll('a[href^="#"]');
    const getHeaderHeight = function() {
      const header = document.querySelector('.l-header');
      return header ? header.offsetHeight : 80;
    };

    for (let j = 0; j < anchors.length; j++) {
      anchors[j].addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;

        const targetId = href.replace(/^/?(.*)/, '$1');
        if (targetId.startsWith('#')) {
          const target = document.querySelector(targetId);
          if (target) {
            e.preventDefault();
            const headerHeight = getHeaderHeight();
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          }
        }
      });
    }
  };

  app.initActiveMenu = function() {
    if (app.activeMenuInitialized) return;
    app.activeMenuInitialized = true;

    const currentPath = location.pathname;
    const navLinks = document.querySelectorAll('.c-nav__link');
    let activeSet = false;

    for (let i = 0; i < navLinks.length; i++) {
      const link = navLinks[i];
      const linkPath = link.getAttribute('href');
      if (linkPath === currentPath || (currentPath === '/' && linkPath === '/index.html') || (currentPath === '/index.html' && linkPath === '/')) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
        activeSet = true;
        break;
      }
    }

    if (!activeSet && (currentPath === '/' || currentPath === '/index.html')) {
      for (let k = 0; k < navLinks.length; k++) {
        const lk = navLinks[k];
        const lkPath = lk.getAttribute('href');
        if (lkPath === '/' || lkPath === '/index.html') {
          lk.setAttribute('aria-current', 'page');
          lk.classList.add('active');
          break;
        }
      }
    }
  };

  app.initScrollSpy = function() {
    if (app.scrollSpyInitialized) return;
    app.scrollSpyInitialized = true;

    const sections = document.querySelectorAll('.l-section[id]');
    const navLinks = document.querySelectorAll('.c-nav__link[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(function(link) {
            const href = link.getAttribute('href');
            if (href === '#' + id) {
              navLinks.forEach(function(l) {
                l.classList.remove('active');
                l.removeAttribute('aria-current');
              });
              link.classList.add('active');
              link.setAttribute('aria-current', 'page');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(function(section) {
      observer.observe(section);
    });
  };

  app.initImages = function() {
    if (app.imagesInitialized) return;
    app.imagesInitialized = true;

    const images = document.querySelectorAll('img');
    const placeholderSVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3EImage unavailable%3C/text%3E%3C/svg%3E';

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      if (!img.hasAttribute('loading')) {
        const isCritical = img.classList.contains('c-logo__img') || img.hasAttribute('data-critical');
        if (!isCritical) {
          img.setAttribute('loading', 'lazy');
        }
      }

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      (function(image) {
        image.addEventListener('error', function() {
          if (this.dataset.fallbackApplied) return;
          this.dataset.fallbackApplied = 'true';
          this.src = placeholderSVG;
          this.style.objectFit = 'contain';
          if (this.closest('.c-logo') || this.classList.contains('c-logo__img')) {
            this.style.maxHeight = '40px';
          }
        });
      })(img);
    }
  };

  app.initScrollAnimations = function() {
    if (app.scrollAnimationsInitialized) return;
    app.scrollAnimationsInitialized = true;

    if (prefersReducedMotion()) return;

    const animatedElements = document.querySelectorAll('.c-card, .c-service-card, .c-pricing-card, .c-timeline__item, .c-stat, .c-feature-list__item, .c-content-block, .c-hero__content, .l-section__header');

    if (animatedElements.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(30px)';
          
          requestAnimationFrame(function() {
            entry.target.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          });

          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(function(el) {
      observer.observe(el);
    });
  };

  app.initCountUp = function() {
    if (app.countUpInitialized) return;
    app.countUpInitialized = true;

    const statNumbers = document.querySelectorAll('.c-stat__number');
    if (statNumbers.length === 0) return;

    const animateCount = function(element) {
      const target = parseInt(element.textContent.replace(/[^0-9]/g, ''), 10);
      if (isNaN(target)) return;

      const suffix = element.textContent.replace(/[0-9]/g, '').trim();
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(function() {
        step++;
        current += increment;
        if (step >= steps) {
          current = target;
          clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
      }, duration / steps);
    };

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          animateCount(entry.target);
        }
      });
    }, observerOptions);

    statNumbers.forEach(function(stat) {
      observer.observe(stat);
    });
  };

  app.initRippleEffect = function() {
    if (app.rippleInitialized) return;
    app.rippleInitialized = true;

    if (prefersReducedMotion()) return;

    const buttons = document.querySelectorAll('.c-button, .c-card__link, .c-service-card__link, .c-nav__link');

    buttons.forEach(function(button) {
      button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.transform = 'scale(0)';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'ripple-animation 0.6s ease-out';

        const style = document.createElement('style');
        if (!document.getElementById('ripple-keyframes')) {
          style.id = 'ripple-keyframes';
          style.textContent = '@keyframes ripple-animation { to { transform: scale(2); opacity: 0; } }';
          document.head.appendChild(style);
        }

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(function() {
          ripple.remove();
        }, 600);
      });
    });
  };

  app.initScrollToTop = function() {
    if (app.scrollToTopInitialized) return;
    app.scrollToTopInitialized = true;

    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'c-scroll-top';
    scrollBtn.setAttribute('aria-label', 'Nach oben scrollen');
    scrollBtn.innerHTML = '↑';
    scrollBtn.style.cssText = 'position: fixed; bottom: 30px; right: 30px; width: 50px; height: 50px; background: var(--color-primary); color: var(--color-white); border: none; border-radius: var(--radius-full); box-shadow: var(--shadow-xl); cursor: pointer; opacity: 0; visibility: hidden; transition: all 0.3s ease-in-out; z-index: var(--z-fixed); font-size: 24px; display: flex; align-items: center; justify-content: center;';

    document.body.appendChild(scrollBtn);

    const toggleVisibility = throttle(function() {
      if (window.pageYOffset > 300) {
        scrollBtn.style.opacity = '1';
        scrollBtn.style.visibility = 'visible';
      } else {
        scrollBtn.style.opacity = '0';
        scrollBtn.style.visibility = 'hidden';
      }
    }, 100);

    window.addEventListener('scroll', toggleVisibility);

    scrollBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    scrollBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1) translateY(-3px)';
    });

    scrollBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1) translateY(0)';
    });
  };

  app.initHeaderScroll = function() {
    if (app.headerScrollInitialized) return;
    app.headerScrollInitialized = true;

    const header = document.querySelector('.l-header');
    if (!header) return;

    const handleScroll = throttle(function() {
      if (window.pageYOffset > 50) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, 100);

    window.addEventListener('scroll', handleScroll);
  };

  app.initModals = function() {
    if (app.modalsInitialized) return;
    app.modalsInitialized = true;

    const privacyLinks = document.querySelectorAll('a[href*="privacy"], .c-form__link');

    privacyLinks.forEach(function(link) {
      if (link.textContent.toLowerCase().includes('datenschutz') || link.textContent.toLowerCase().includes('privacy')) {
        link.addEventListener('click', function(e) {
          const href = this.getAttribute('href');
          if (href && (href.includes('privacy') || href.includes('#privacy'))) {
            e.preventDefault();
            app.showModal('Datenschutzerklärung', '<p>Ihre Daten werden gemäß DSGVO verarbeitet und geschützt. Weitere Informationen finden Sie in unserer vollständigen Datenschutzerklärung.</p><p><a href="/privacy.html" class="c-button c-button--primary">Zur Datenschutzerklärung</a></p>');
          }
        });
      }
    });
  };

  app.showModal = function(title, content) {
    let modal = document.getElementById('app-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'app-modal';
      modal.className = 'c-modal';
      modal.innerHTML = '<div class="c-modal__overlay"></div><div class="c-modal__content"><button class="c-modal__close" aria-label="Schließen">×</button><div class="c-modal__body"></div></div>';
      document.body.appendChild(modal);

      const overlay = modal.querySelector('.c-modal__overlay');
      const closeBtn = modal.querySelector('.c-modal__close');

      const closeModal = function() {
        modal.classList.remove('is-open');
        document.body.classList.remove('u-no-scroll');
      };

      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', closeModal);

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) {
          closeModal();
        }
      });
    }

    const modalBody = modal.querySelector('.c-modal__body');
    modalBody.innerHTML = '<h2>' + escapeHtml(title) + '</h2>' + content;

    modal.classList.add('is-open');
    document.body.classList.add('u-no-scroll');
  };

  app.initForms = function() {
    if (app.formsInitialized) return;
    app.formsInitialized = true;

    const forms = document.querySelectorAll('.c-form, form[id]');

    const validators = {
      name: {
        pattern: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        message: 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen, nur Buchstaben).'
      },
      email: {
        pattern: /^[^s@]+@[^s@]+.[^s@]+$/,
        message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
      },
      phone: {
        pattern: /^[ds+-()]{10,20}$/,
        message: 'Bitte geben Sie eine gültige Telefonnummer ein (10-20 Zeichen).'
      },
      message: {
        minLength: 10,
        message: 'Die Nachricht muss mindestens 10 Zeichen lang sein.'
      },
      textarea: {
        minLength: 10,
        message: 'Bitte geben Sie mindestens 10 Zeichen ein.'
      }
    };

    const showError = function(field, message) {
      const group = field.closest('.c-form__group');
      if (!group) return;

      group.classList.add('has-error');
      let errorElement = group.querySelector('.c-form__error');

      if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'c-form__error';
        errorElement.setAttribute('role', 'alert');
        field.parentNode.insertBefore(errorElement, field.nextSibling);
      }

      errorElement.textContent = message;
      errorElement.style.display = 'block';
    };

    const clearError = function(field) {
      const group = field.closest('.c-form__group');
      if (!group) return;

      group.classList.remove('has-error');
      const errorElement = group.querySelector('.c-form__error');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    };

    const validateField = function(field) {
      const name = field.getAttribute('name');
      const value = field.value.trim();
      const type = field.getAttribute('type');
      const isRequired = field.hasAttribute('required') || field.hasAttribute('aria-required');

      clearError(field);

      if (isRequired && !value) {
        showError(field, 'Dieses Feld ist erforderlich.');
        return false;
      }

      if (!value) return true;

      if (name === 'email' || type === 'email') {
        if (!validators.email.pattern.test(value)) {
          showError(field, validators.email.message);
          return false;
        }
      }

      if (name === 'phone' || type === 'tel') {
        if (!validators.phone.pattern.test(value)) {
          showError(field, validators.phone.message);
          return false;
        }
      }

      if (name === 'name' && name !== 'email' && name !== 'phone') {
        if (!validators.name.pattern.test(value)) {
          showError(field, validators.name.message);
          return false;
        }
      }

      if (field.tagName === 'TEXTAREA' || name === 'message') {
        if (value.length < validators.textarea.minLength) {
          showError(field, validators.textarea.message);
          return false;
        }
      }

      if (type === 'checkbox' && isRequired && !field.checked) {
        showError(field, 'Sie müssen dieses Feld akzeptieren.');
        return false;
      }

      return true;
    };

    const validateForm = function(form) {
      let isValid = true;
      const fields = form.querySelectorAll('input:not([type="hidden"]), textarea, select');

      fields.forEach(function(field) {
        if (!validateField(field)) {
          isValid = false;
        }
      });

      return isValid;
    };

    forms.forEach(function(form) {
      const fields = form.querySelectorAll('input:not([type="hidden"]), textarea, select');

      fields.forEach(function(field) {
        field.addEventListener('blur', function() {
          validateField(this);
        });

        field.addEventListener('input', debounce(function() {
          if (this.closest('.c-form__group').classList.contains('has-error')) {
            validateField(this);
          }
        }, 300));
      });

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const isSearchForm = form.querySelector('#search-marke, #search-typ');
        if (isSearchForm) {
          return;
        }

        if (!validateForm(form)) {
          const firstError = form.querySelector('.has-error');
          if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        let originalText = '';

        if (submitBtn) {
          originalText = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px;"></span>Wird gesendet...';

          const style = document.createElement('style');
          if (!document.getElementById('spinner-keyframes')) {
            style.id = 'spinner-keyframes';
            style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
          }
        }

        setTimeout(function() {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }

          app.showNotification('Ihre Nachricht wurde erfolgreich gesendet!', 'success');
          
          setTimeout(function() {
            window.location.href = '/thank_you.html';
          }, 1500);
        }, 1500);
      });
    });
  };

  app.showNotification = function(message, type) {
    let container = document.getElementById('notification-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: var(--z-toast); max-width: 350px;';
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = 'c-notification c-notification--' + (type || 'info');
    notification.style.cssText = 'background: ' + (type === 'success' ? 'var(--color-success)' : 'var(--color-primary)') + '; color: var(--color-white); padding: var(--space-md) var(--space-lg); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); margin-bottom: var(--space-md); animation: slideInRight 0.3s ease-out; display: flex; align-items: center; gap: var(--space-md);';
    notification.innerHTML = '<span>' + escapeHtml(message) + '</span><button style="background: none; border: none; color: inherit; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;" aria-label="Schließen">×</button>';

    const style = document.createElement('style');
    if (!document.getElementById('notification-keyframes')) {
      style.id = 'notification-keyframes';
      style.textContent = '@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }';
      document.head.appendChild(style);
    }

    container.appendChild(notification);

    const closeBtn = notification.querySelector('button');
    const removeNotification = function() {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(function() {
        notification.remove();
      }, 300);
    };

    closeBtn.addEventListener('click', removeNotification);

    setTimeout(removeNotification, 5000);
  };

  app.init = function() {
    if (app.initialized) return;
    app.initialized = true;

    app.initBurger();
    app.initAnchors();
    app.initActiveMenu();
    app.initScrollSpy();
    app.initImages();
    app.initScrollAnimations();
    app.initCountUp();
    app.initRippleEffect();
    app.initScrollToTop();
    app.initHeaderScroll();
    app.initModals();
    app.initForms();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }
})();
.c-nav__list {
  height: calc(100vh - var(--header-h-mobile));
}

@media (min-width: 1024px) {
  .c-nav__list {
    height: auto;
  }
}

.c-card,
.c-service-card,
.c-pricing-card,
.c-timeline__item,
.c-stat,
.c-feature-list__item,
.c-content-block,
.c-hero__content,
.l-section__header {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.c-button,
.c-card__link,
.c-service-card__link {
  position: relative;
  overflow: hidden;
}

.c-header {
  transition: box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out;
}

.c-nav__toggle {
  transition: background-color 0.3s ease-in-out, transform 0.2s ease-in-out, box-shadow 0.3s ease-in-out;
}

.c-nav__toggle-icon,
.c-nav__toggle-icon::before,
.c-nav__toggle-icon::after {
  transition: all 0.3s ease-in-out;
}

.c-nav__list {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.c-nav__link::before {
  transition: width 0.3s ease-in-out;
}

.c-button:hover,
.c-button:focus-visible {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.c-card:hover,
.c-service-card:hover,
.c-pricing-card:hover {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.c-card__img {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.c-card__icon-wrapper,
.c-service-card__icon-wrapper {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.c-feature-list__item:hover {
  transition: all 0.3s ease-in-out;
}

.c-timeline__content {
  transition: all 0.3s ease-in-out;
}

.c-logo:hover {
  transition: all 0.3s ease-in-out;
}

@keyframes ripple-animation {
  to {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.c-modal.is-open {
  animation: fadeIn 0.3s ease-out;
}

.c-modal__overlay {
  animation: fadeIn 0.3s ease-out;
}

.c-modal__content {
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.c-scroll-top {
  transition: all 0.3s ease-in-out;
}

.c-form__input:focus,
.c-form__textarea:focus,
.c-form__select:focus {
  transition: all 0.25s ease-in-out;
}

.c-contact-info__item:hover,
.c-culture__item:hover {
  transition: all 0.3s ease-in-out;
}

a,
.c-nav__link,
.c-card__link,
.c-service-card__link,
.c-contact-info__link {
  transition: color 0.25s ease-in-out, transform 0.25s ease-in-out;
}
