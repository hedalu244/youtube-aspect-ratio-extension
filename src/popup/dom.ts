// idから要素を取得する。存在しないときと型が違うときはエラーを投げる。
export function getElementById<T extends HTMLElement>(id: string, constructor: { new(): T; }): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    if (!(element instanceof constructor)) {
        throw new Error(`${element} is not a ${constructor.name}`);
    }
    return element;
}

// nameから要素を取得する。存在しないときと型が違うときはエラーを投げる。
export function getElementsByName<T extends HTMLElement>(name: string, constructor: { new(): T; }): T[] {
    const nodeList = document.getElementsByName(name);
    const elements: T[] = [];
    if (nodeList.length === 0) {
        throw new Error(`Element with name "${name}" not found`);
    }
    for (const element of nodeList) {
        if (!(element instanceof constructor)) {
            throw new Error(`${element} is not a ${constructor.name}`);
        }
        elements.push(element);
    }
    return elements;
}

// ラジオボタンの値を取得する。
export function getRadioValue(name: string): string {
    const radios = getElementsByName(name, HTMLInputElement);
    for (const radio of radios) {
        if (radio.checked) return radio.value;
    }
    throw new Error(`No radio button with name "${name}" is checked`);
}

// ラジオボタンの値を設定する。
export function setRadioValue(name: string, value: string) {
    getElementsByName(name, HTMLInputElement).forEach(radio => {
        radio.checked = radio.value === value;
    });
}

// ラジオボタンのグループに変更リスナーを設定する。
export function setChangeListenerToRadioGroup(name: string, handler: () => void) {
    getElementsByName(name, HTMLInputElement).forEach(radio => radio.addEventListener("change", handler));
}