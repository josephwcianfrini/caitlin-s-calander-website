// Weekly Planner Application
class WeeklyPlanner {
    constructor() {
        this.currentWeekOffset = 0;
        this.events = this.loadEvents();
        this.currentEditingEvent = null;
        this.hours = this.generateHours();
        this.init();
    }

    init() {
        this.renderTimeSlots();
        this.renderWeek();
        this.attachEventListeners();
    }

    generateHours() {
        const hours = [];
        for (let i = 0; i < 24; i++) {
            const hour = i % 12 === 0 ? 12 : i % 12;
            const period = i < 12 ? 'AM' : 'PM';
            hours.push(`${hour}:00 ${period}`);
        }
        return hours;
    }

    renderTimeSlots() {
        const timeSlotsContainer = document.getElementById('timeSlots');
        timeSlotsContainer.innerHTML = this.hours.map(hour =>
            `<div class="time-slot">${hour}</div>`
        ).join('');
    }

    getWeekDates() {
        const today = new Date();
        const currentDay = today.getDay();
        const diff = today.getDate() - currentDay + (this.currentWeekOffset * 7);
        const sunday = new Date(today.setDate(diff));

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(sunday);
            date.setDate(sunday.getDate() + i);
            weekDates.push(date);
        }
        return weekDates;
    }

    formatDate(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    renderWeek() {
        const weekDates = this.getWeekDates();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Update week display
        const firstDate = weekDates[0];
        const lastDate = weekDates[6];
        const weekDisplay = `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        document.getElementById('currentWeek').textContent = weekDisplay;

        // Render day columns
        const daysContainer = document.getElementById('daysContainer');
        daysContainer.innerHTML = weekDates.map((date, index) => {
            const dateKey = this.formatDateKey(date);
            const dayEvents = this.events.filter(e => e.date === dateKey);

            return `
                <div class="day-column">
                    <div class="day-header" data-day="${index}" data-date="${dateKey}">
                        <div class="day-name">${dayNames[index]}</div>
                        <div class="day-date">${this.formatDate(date)}</div>
                    </div>
                    <div class="day-slots" data-day="${index}" data-date="${dateKey}">
                        ${this.renderDaySlots(dateKey, dayEvents)}
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners to day headers and time blocks
        this.attachDayListeners();
    }

    renderDaySlots(dateKey, dayEvents) {
        let slots = '';
        for (let hour = 0; hour < 24; hour++) {
            const eventsInThisSlot = dayEvents.filter(e => {
                const eventStartHour = parseInt(e.startTime.split(':')[0]);
                return eventStartHour === hour;
            });

            if (eventsInThisSlot.length > 0) {
                eventsInThisSlot.forEach(event => {
                    const duration = this.calculateDuration(event.startTime, event.endTime);
                    const height = duration * 60; // 60px per hour
                    slots += `
                        <div class="time-block event"
                             data-event-id="${event.id}"
                             style="height: ${height}px; min-height: ${height}px;">
                            <div class="event-title">${event.title}</div>
                            <div class="event-time">${this.formatTime12Hour(event.startTime)} - ${this.formatTime12Hour(event.endTime)}</div>
                            ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                        </div>
                    `;
                });
            } else {
                slots += `<div class="time-block" data-hour="${hour}" data-date="${dateKey}"></div>`;
            }
        }
        return slots;
    }

    calculateDuration(startTime, endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return (endMinutes - startMinutes) / 60;
    }

    formatTime12Hour(time24) {
        const [hour, minute] = time24.split(':').map(Number);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    attachDayListeners() {
        // Click on day header to add event
        document.querySelectorAll('.day-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const day = parseInt(header.dataset.day);
                const date = header.dataset.date;
                this.openModal(null, day, date);
            });
        });

        // Click on time block to add event
        document.querySelectorAll('.time-block:not(.event)').forEach(block => {
            block.addEventListener('click', (e) => {
                const hour = parseInt(block.dataset.hour);
                const date = block.dataset.date;
                const weekDates = this.getWeekDates();
                const targetDate = new Date(date);
                const day = targetDate.getDay();
                this.openModal(null, day, date, hour);
            });
        });

        // Click on event to edit
        document.querySelectorAll('.event').forEach(eventEl => {
            eventEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = eventEl.dataset.eventId;
                const event = this.events.find(e => e.id === eventId);
                if (event) {
                    this.openModal(event);
                }
            });
        });
    }

    attachEventListeners() {
        // Quick add button
        document.getElementById('quickAddBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Week navigation
        document.getElementById('prevWeek').addEventListener('click', () => {
            this.currentWeekOffset--;
            this.renderWeek();
        });

        document.getElementById('nextWeek').addEventListener('click', () => {
            this.currentWeekOffset++;
            this.renderWeek();
        });

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') {
                this.closeModal();
            }
        });

        // Form submission
        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // Delete event
        document.getElementById('deleteEvent').addEventListener('click', () => {
            if (this.currentEditingEvent) {
                this.deleteEvent(this.currentEditingEvent.id);
            }
        });
    }

    openModal(event = null, day = null, date = null, hour = null) {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const deleteBtn = document.getElementById('deleteEvent');
        const modalTitle = document.getElementById('modalTitle');

        // Reset form
        form.reset();

        if (event) {
            // Edit mode
            modalTitle.textContent = 'Edit Event';
            deleteBtn.style.display = 'block';
            this.currentEditingEvent = event;

            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventStartTime').value = event.startTime;
            document.getElementById('eventEndTime').value = event.endTime;

            const eventDate = new Date(event.date);
            document.getElementById('eventDay').value = eventDate.getDay();
        } else {
            // Add mode
            modalTitle.textContent = 'Add Event';
            deleteBtn.style.display = 'none';
            this.currentEditingEvent = null;

            if (day !== null) {
                document.getElementById('eventDay').value = day;
            }

            if (hour !== null) {
                const startTime = `${hour.toString().padStart(2, '0')}:00`;
                const endHour = (hour + 1) % 24;
                const endTime = `${endHour.toString().padStart(2, '0')}:00`;
                document.getElementById('eventStartTime').value = startTime;
                document.getElementById('eventEndTime').value = endTime;
            }
        }

        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('eventModal');
        modal.classList.remove('show');
        this.currentEditingEvent = null;
    }

    saveEvent() {
        const title = document.getElementById('eventTitle').value;
        const description = document.getElementById('eventDescription').value;
        const day = parseInt(document.getElementById('eventDay').value);
        const startTime = document.getElementById('eventStartTime').value;
        const endTime = document.getElementById('eventEndTime').value;

        // Calculate the date for the selected day
        const weekDates = this.getWeekDates();
        const eventDate = weekDates[day];
        const dateKey = this.formatDateKey(eventDate);

        if (this.currentEditingEvent) {
            // Update existing event
            const eventIndex = this.events.findIndex(e => e.id === this.currentEditingEvent.id);
            this.events[eventIndex] = {
                ...this.events[eventIndex],
                title,
                description,
                date: dateKey,
                startTime,
                endTime
            };
        } else {
            // Create new event
            const newEvent = {
                id: Date.now().toString(),
                title,
                description,
                date: dateKey,
                startTime,
                endTime
            };
            this.events.push(newEvent);
        }

        this.saveEvents();
        this.renderWeek();
        this.closeModal();
    }

    deleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveEvents();
            this.renderWeek();
            this.closeModal();
        }
    }

    loadEvents() {
        const stored = localStorage.getItem('weeklyPlannerEvents');
        return stored ? JSON.parse(stored) : [];
    }

    saveEvents() {
        localStorage.setItem('weeklyPlannerEvents', JSON.stringify(this.events));
    }
}

// Initialize the planner when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WeeklyPlanner();
});
