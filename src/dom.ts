export function getElement<T extends HTMLElement>(id: string, constructor: { new(): T; }): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    if (!(element instanceof constructor)) {
        throw new Error(`Element with id "${id}" is not a ${constructor.name}`);
    }
    return element;
}

export function getRadioValue(name: string): string {
    return (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement).value;
}

export function setRadioValue(name: string, value: string) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
        (radio as HTMLInputElement).checked = (radio as HTMLInputElement).value === value;
    });
}