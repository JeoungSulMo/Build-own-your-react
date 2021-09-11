
// 엘리먼트가 아닌 primitive value에대한 wrapping 함수
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// 돔요소 생성
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

// fiber 자료구조를 이용한 DOM 생성
function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props) 

  return dom;
}

// updateDom에서 사용할 메소드
const isEvent = key => key.startsWith("on") // 이벤트 리스너 분리
const isProperty = key => key !== "children" && !isEvent(key) 
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

// 추가와 삭제는 appendChild, removeChild 함수를 쓰면 되지만 업데이트는 프롭스를 변경시켜줘야 한다.
function updateDom(dom, prevProps, nextProps) {
  // 안쓰거나 수정된 이벤트 리스너 제거
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })
  // 필요 없어진 props 제거
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })
  // 새로 생성되거나 수정된 props 적용
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })
  
  // 이벤트 리스너 추가 로직
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}

function commitRoot() {
  deletions.forEach(commitWork); 
  commitWork(wipRoot.child);
  currentRoot = wipRoot // 최신 파이버트리를 실제 Dom트리에 커밋 완료 후 따로 저장
  wipRoot = null;
}

function commitWork(fiber) {
  // 더 이상 자식 요소가 없으면 종료
  if (!fiber) {
    return;
  }
  // 함수형 컴포넌트가 존재하기 전엔 type 유형이 "TEXT_ELEMENT" 또는 div, span 등등의 형태였다면
  // 함수형 컴포넌트에서는 createElement에서 type유형에 function이 들어가게 된다.
  // 그래서 따로 createDom에대한 작업이 없고, 해당 function component에 dom이 없다.
  // 위 상황을 고려해 부모 파이버의 돔이 존재하지 않을수 있기 때문에 DOM노드가 존재하는 가장 가까운 
  // 직계 조상파이버를 찾는다. 
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom  
  // effectTag별  처리
  // PLACEMENT == 생성, UPDATE == 수정, DELETION == 삭제
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent)
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// 위의 부모 파이버의 DOM을 찾는 이유와 같음으로, DOM노드가 존재하지 않는 파이버를 위한 처리
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}


function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot, // 이전 커밋단계의 파이버 트리와 연결을 위함
  };
  deletions = []
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

// 작업 단위별 수행 기능에서 새로운 파이버 생성 로직 분리
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

// 함수형 컴포넌트시 업데이트 방식
// 기존과 차이는 돔을 바로 생성하지 않고 
function updateFunctionComponent(fiber){
  const children = [fiber.type(fiber.props)] // 인자로 받은 props 전체를 넘김
  reconcileChildren(fiber, children)
}

// 기존 컴포넌트 업데이트 방식
function updateHostComponent(fiber){
  if (!fiber.dom){
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

function reconcileChildren(wipFiber, elements){
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  // 자식 파이버 생성 및 연결
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type == oldFiber.type

    if (sameType) {
      // Todo update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType){
      // Todo add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if (oldFiber && !sameType){
      // Todo delete the oldFiber's node
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }
    if (oldFiber) {
        oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

export const Didact = {
  createElement,
  render,
};

/** @jsx Didact.createElement */
export default function App(props){
  return (
    <div>
      <h1>Hi {props.name}</h1>
    </div>
  )
}
