import styled from "styled-components";

export function InputText({ children, icono }) {
  return (
    <Container>
      <span>{icono}</span>

      <div className="form__group field">{children}</div>
    </Container>
  );
}
const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  p {
    color: #5396AC;
  }
  .form__group {
    position: relative;
    padding: 20px 0 0;
    width: 100%;
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-background-clip: text;
    -webkit-text-fill-color: ${(props)=>props.theme.text};
    transition: background-color 5000s ease-in-out 0s;
    
  }
  .form__field {
    font-family: inherit;
    width: 100%;
    border: none;
    border-bottom: 2px solid #9b9b9b;
    outline: 0;
    font-size: 17px;
    color: ${(props)=>props.theme.text};
    padding: 7px 0;
    background: transparent;
    transition: border-color 0.2s;
    &.disabled{
      color: #696969;
      background: #2d2d2d;
      border-radius:8px;
      margin-top:8px;
      border-bottom: 1px dashed #656565;

    }
  }

  select.form__field {
    background-color: ${(props) => props.theme.bgtotal};
    color: ${(props) => props.theme.text};
  }

  select.form__field option {
    background-color: ${(props) => props.theme.bgtotal};
    color: ${(props) => props.theme.text};
  }

  .form__field::placeholder {
    color: transparent;
  }

  .form__field:placeholder-shown ~ .form__label {
    font-size: 17px;
    cursor: text;
    top: 20px;
  }

  .form__label {
    position: absolute;
    top: 0;
    display: block;
    transition: 0.2s;
    font-size: 17px;
    color: #9b9b9b;
    pointer-events: none;
  }

  .form__label.with-link {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6px;
    max-width: 100%;
    line-height: 1.15;
  }

  .form__label .label-link {
    pointer-events: auto;
    font-size: 0.70em;
    color: ${({ theme }) => theme.color1};
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .form__field:focus {
    padding-bottom: 6px;
    font-weight: 700;
    border-width: 1px;
    border-image: linear-gradient(to right, #5396AC, #377b92);
    border-image-slice: 1;
  }

  .form__field:focus ~ .form__label {
    position: absolute;
    top: 0;
    display: block;
    transition: 0.2s;
    font-size: 17px;
    color: #5396AC;
    font-weight: 700;
  }

  
  .form__field:required,
  .form__field:invalid {
    box-shadow: none;
  }
 
`; 
