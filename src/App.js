import React, { useState } from 'react';
import './App.css';
import { balance as balancer } from './balance'
function createMarkup(html) {
    return { __html: html };
}

function App() {
    // const solve = (x = "") => {
    //     x = x.replace(/^(\d+)/g, '')
    //     x = x.replace(/([^A-Za-z()])(\d+)/g, '')
    //     if (x.split("=").length < 2)
    //         return "Chưa đủ 2 vế của phương trình";
    //     let bigNumber = 1;
    //     var arrayOfNumbers = new Set(x.split(/\D+/g));
    //     arrayOfNumbers.delete("");
    //     for (let i of arrayOfNumbers) bigNumber *= parseInt(i);

    //     var left = x.split("=")[0].split("+");
    //     var righ = x.split("=")[1].split("+");
    //     var molecules = left.length + righ.length;

    //     var elems = new Set(x.replace(/\d+|\+|=/g, "").match(/([A-Z][a-z]*)/g));
    //     elems.delete("");

    //     var rrefArray = [];
    //     for (let elem of elems) {
    //         var buildArr = [], numberAfterElement;
    //         for (let molecule of left) {
    //             var index = molecule.indexOf(elem);
    //             if (index === -1) buildArr.push(0);
    //             else {
    //                 index += elem.length;
    //                 numberAfterElement = molecule.substring(index).match(/^\d+/g);
    //                 if (numberAfterElement === null) buildArr.push(1);
    //                 else buildArr.push(parseInt(numberAfterElement));
    //             }
    //         }
    //         for (let molecule of righ) {
    //             index = molecule.indexOf(elem);
    //             if (index === -1) buildArr.push(0);
    //             else {
    //                 index += elem.length;
    //                 numberAfterElement = molecule.substring(index).match(/^\d+/g);
    //                 if (numberAfterElement === null) buildArr.push(-1);
    //                 else buildArr.push(parseInt(numberAfterElement) * (-1));
    //             }
    //         }
    //         rrefArray.push(buildArr);
    //     }

    //     for (var pivot = 0; pivot < Math.min(molecules, elems.size); pivot++) {
    //         var workingOnThisRow;
    //         for (let i = pivot; i < rrefArray.length; i++) {
    //             let row = rrefArray[i];
    //             if (row[pivot] !== 0) {
    //                 workingOnThisRow = rrefArray.splice(rrefArray.indexOf(row), 1)[0];
    //             }
    //         }
    //         var multiplyWhat = bigNumber / workingOnThisRow[pivot]
    //         for (let i = 0; i < workingOnThisRow.length; i++) workingOnThisRow[i] *= multiplyWhat
    //         for (let i in rrefArray) {
    //             let row = rrefArray[i];
    //             if (row[pivot] !== 0) {
    //                 multiplyWhat = bigNumber / row[pivot]
    //                 for (var j = 0; j < row.length; j++) {
    //                     row[j] *= multiplyWhat;
    //                     row[j] -= workingOnThisRow[j];
    //                     row[j] /= multiplyWhat;
    //                 }
    //                 rrefArray[i] = row;
    //             }
    //         }
    //         rrefArray.splice(pivot, 0, workingOnThisRow);
    //     }

    //     if (rrefArray[0][elems.size] === 0 || rrefArray[0][elems.size] === undefined) return "Một vế của phương trình đã bị bỏ trống!";

    //     bigNumber *= -1;
    //     const gcd_calc = function (a, b) {
    //         if (!b) return a;
    //         return gcd_calc(b, a % b);
    //     };
    //     var coEffs = [];
    //     var gcd = bigNumber;
    //     for (let i = 0; i < rrefArray.length; i++) {
    //         var num = rrefArray[i][molecules - 1];
    //         coEffs.push(num);
    //         gcd = gcd_calc(gcd, num)
    //     }
    //     coEffs.push(bigNumber);
    //     for (let i = 0; i < coEffs.length; i++) coEffs[i] /= gcd;

    //     var out = "";
    //     for (var i = 0; i < coEffs.length; i++) {
    //         var coEff = coEffs[i];
    //         if (coEff !== 1) out += coEff;
    //         out += left.shift();
    //         if (left.length === 0 && righ.length !== 0) {
    //             out += " = ";
    //             left = righ;
    //         } else if (i !== coEffs.length - 1) out += "+";
    //     }
    //     return out;
    // }
    const [string, setString] = useState("")
    const [balance, setBalance] = useState("")
    console.log(string)
    return (
        <div className="App">
            <input style={{width: "400px", textAlign: "center"}} onChange={e => setString(e.target.value)} onKeyPress={e => {
                if (e.key === 'Enter') {
                    let x = e.target.value
                    x = x.replace(/^(\d+)/g, '')
                    x = x.replace(/([^A-Za-z()])(\d+)/g, '')
                    console.log(x)
                    setBalance(balancer(x))
                }
            }} />
            <div dangerouslySetInnerHTML={createMarkup(string.replace(/([A-Za-z])(\d+)/g, '$1<sub>$2</sub>').replace(/\)(\d+)/g, ')<sub>$1</sub>'))} >
            </div>
            <div dangerouslySetInnerHTML={createMarkup(balance.replace(/([A-Za-z])(\d+)/g, '$1<sub>$2</sub>'))} >
            </div>
            <iframe scrolling="no" width="600px" height="450px" src="https://chem-space.com/search#mol"></iframe>
        </div>
    );
}

export default App;
